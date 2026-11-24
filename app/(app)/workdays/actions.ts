"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateWorkdays,
  canDeleteWorkdays,
  canManageWorkdays,
} from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/client";
import {
  assertWorkdayWritePolicy,
  canLeaderArchiveWorkday,
  type WorkdayPolicySnapshot,
} from "@/lib/domain/workday-write-policy";
import { auditSuccess } from "@/lib/logs/record-log";
import { replayWorkdayDurationCredits } from "@/lib/repos/workday-credit-replay";
import {
  archiveWorkdays,
  createWorkday as createWorkdayRepo,
  findWorkdayById,
  findWorkdayWithRelations,
  hardDeleteWorkday,
  reactivateWorkdays,
  toWorkdayPolicySnapshot,
  updateWorkday as updateWorkdayRepo,
} from "@/lib/repos/workdays";
import { parseArchiveReason } from "@/lib/schemas/archive-with-reason";
import {
  bulkWorkdayIdsSchema,
  normalizeWorkdayFormValues,
  workdayFormSchema,
  type NormalizedWorkdayInput,
  type WorkdayFormInput,
} from "@/lib/schemas/workday";
import { workdayListFiltersSchema } from "@/lib/schemas/workday-list-filters";
import {
  loadWorkdayListPage,
  WORKDAY_LIST_CACHE_TAG,
  type WorkdayListPageResult,
} from "@/lib/workdays/load-workday-list-page";
import { resolveWorkdayViewerContext } from "@/lib/workdays/resolve-workday-viewer";
import { WORKDAYS_LIST_PATH } from "@/lib/workdays/workday-list-sort-url";

async function requireActor() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;
  if (!canManageWorkdays(role) || !userId) {
    throw new Error("forbidden");
  }
  const viewerContext = await resolveWorkdayViewerContext({ role, userId });
  if (!viewerContext?.writeContext) {
    throw new Error("forbidden");
  }
  return {
    role,
    userId,
    writeContext: viewerContext.writeContext,
    viewerContext,
  };
}

function asPolicySnapshot(
  data: NormalizedWorkdayInput,
): WorkdayPolicySnapshot {
  return {
    action: data.action,
    scope: data.scope,
    timezone: data.timezone,
    validFrom: data.validFrom,
    validUntil: data.validUntil,
    description: data.description,
    userIds: data.userIds,
    teamIds: data.teamIds,
    slots: data.slots,
  };
}

function invalidateWorkdays(): void {
  revalidateTag(WORKDAY_LIST_CACHE_TAG, "default");
  revalidatePath(WORKDAYS_LIST_PATH);
}

async function replayById(id: string): Promise<void> {
  const full = await findWorkdayWithRelations(id);
  if (!full) return;
  await replayWorkdayDurationCredits(full, getDb());
}

export async function loadMoreWorkdays(
  rawFilters: unknown,
  page: number,
): Promise<WorkdayListPageResult> {
  const actor = await requireActor();
  const filters = workdayListFiltersSchema.parse(rawFilters);
  return loadWorkdayListPage(filters, page, actor.viewerContext);
}

export async function createWorkday(raw: WorkdayFormInput): Promise<void> {
  const actor = await requireActor();
  const data = normalizeWorkdayFormValues(workdayFormSchema.parse(raw));
  assertWorkdayWritePolicy(
    asPolicySnapshot(data),
    actor.writeContext,
    null,
  );
  const created = await createWorkdayRepo({
    ...data,
    actorUserId: actor.userId,
  });
  await auditSuccess({
    route: WORKDAYS_LIST_PATH,
    verb: "created",
    entity: "workday",
    name: data.action,
  });
  await replayById(created.id);
  invalidateWorkdays();
}

export async function updateWorkday(
  documentId: string,
  raw: WorkdayFormInput,
): Promise<void> {
  const actor = await requireActor();
  const existing = await findWorkdayWithRelations(documentId);
  if (!existing) throw new Error("notFound");
  const data = normalizeWorkdayFormValues(workdayFormSchema.parse(raw));
  assertWorkdayWritePolicy(
    asPolicySnapshot(data),
    actor.writeContext,
    toWorkdayPolicySnapshot(existing),
  );
  await updateWorkdayRepo(documentId, {
    ...data,
    actorUserId: actor.userId,
  });
  await auditSuccess({
    route: WORKDAYS_LIST_PATH,
    verb: "updated",
    entity: "workday",
    name: data.action,
  });
  await replayById(documentId);
  invalidateWorkdays();
}

export async function bulkArchiveWorkdays(
  documentIds: string[],
  reason: string,
): Promise<void> {
  const actor = await requireActor();
  if (!canDeactivateWorkdays(actor.role)) throw new Error("forbidden");
  const ids = bulkWorkdayIdsSchema.parse(documentIds);
  const text = parseArchiveReason(reason, ids.length);

  for (const documentId of ids) {
    const workday = await findWorkdayWithRelations(documentId);
    if (!workday) throw new Error("notFound");
    if (actor.role === "leader") {
      const allowed = canLeaderArchiveWorkday(
        toWorkdayPolicySnapshot(workday),
        actor.writeContext,
      );
      if (!allowed) throw new Error("forbidden");
    }
  }

  await archiveWorkdays(ids, text);
  await auditSuccess({
    route: WORKDAYS_LIST_PATH,
    verb: "bulkArchived",
    entity: "workdays",
    quantity: ids.length,
  });
  for (const id of ids) {
    await replayById(id);
  }
  invalidateWorkdays();
}

export async function bulkReactivateWorkdays(
  documentIds: string[],
): Promise<void> {
  const actor = await requireActor();
  if (actor.role === "leader") throw new Error("forbidden");
  const ids = bulkWorkdayIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const workday = await findWorkdayById(documentId);
    if (!workday) throw new Error("notFound");
    if (workday.active) throw new Error("activeWorkday");
  }

  await reactivateWorkdays(ids);
  await auditSuccess({
    route: WORKDAYS_LIST_PATH,
    verb: "bulkReactivated",
    entity: "workdays",
    quantity: ids.length,
  });
  for (const id of ids) {
    await replayById(id);
  }
  invalidateWorkdays();
}

export async function bulkDeleteWorkdays(documentIds: string[]): Promise<void> {
  const session = await auth();
  if (!canDeleteWorkdays(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
  const ids = bulkWorkdayIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const workday = await findWorkdayById(documentId);
    if (!workday) throw new Error("notFound");
    if (workday.active) throw new Error("activeWorkday");
    await hardDeleteWorkday(documentId);
  }

  await auditSuccess({
    route: WORKDAYS_LIST_PATH,
    verb: "bulkDeleted",
    entity: "workdays",
    quantity: ids.length,
  });
  invalidateWorkdays();
}
