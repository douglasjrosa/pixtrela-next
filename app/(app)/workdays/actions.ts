"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateWorkdays,
  canDeleteWorkdays,
  canManageWorkdays,
} from "@/lib/auth/permissions";
import { auditSuccess } from "@/lib/logs/record-log";
import {
  archiveWorkdays,
  createWorkday as createWorkdayRepo,
  findWorkdayById,
  hardDeleteWorkday,
  reactivateWorkdays,
  updateWorkday as updateWorkdayRepo,
} from "@/lib/repos/workdays";
import { parseArchiveReason } from "@/lib/schemas/archive-with-reason";
import {
  bulkWorkdayIdsSchema,
  normalizeWorkdayFormValues,
  workdayFormSchema,
  type WorkdayFormInput,
} from "@/lib/schemas/workday";
import { workdayListFiltersSchema } from "@/lib/schemas/workday-list-filters";
import {
  loadWorkdayListPage,
  WORKDAY_LIST_CACHE_TAG,
  type WorkdayListPageResult,
} from "@/lib/workdays/load-workday-list-page";
import { WORKDAYS_LIST_PATH } from "@/lib/workdays/workday-list-sort-url";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageWorkdays(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanDeactivate(): Promise<void> {
  const session = await auth();
  if (!canDeactivateWorkdays(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanDelete(): Promise<void> {
  const session = await auth();
  if (!canDeleteWorkdays(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateWorkdays(): void {
  revalidateTag(WORKDAY_LIST_CACHE_TAG, "default");
  revalidatePath(WORKDAYS_LIST_PATH);
}

export async function loadMoreWorkdays(
  rawFilters: unknown,
  page: number,
): Promise<WorkdayListPageResult> {
  await assertCanManage();
  const filters = workdayListFiltersSchema.parse(rawFilters);
  return loadWorkdayListPage(filters, page);
}

export async function createWorkday(raw: WorkdayFormInput): Promise<void> {
  await assertCanManage();
  const data = normalizeWorkdayFormValues(workdayFormSchema.parse(raw));
  await createWorkdayRepo(data);
  await auditSuccess({
    route: WORKDAYS_LIST_PATH,
    verb: "created",
    entity: "workday",
    name: data.name,
  });
  invalidateWorkdays();
}

export async function updateWorkday(
  documentId: string,
  raw: WorkdayFormInput,
): Promise<void> {
  await assertCanManage();
  const data = normalizeWorkdayFormValues(workdayFormSchema.parse(raw));
  await updateWorkdayRepo(documentId, data);
  await auditSuccess({
    route: WORKDAYS_LIST_PATH,
    verb: "updated",
    entity: "workday",
    name: data.name,
  });
  invalidateWorkdays();
}

export async function bulkArchiveWorkdays(
  documentIds: string[],
  reason: string,
): Promise<void> {
  await assertCanDeactivate();
  const ids = bulkWorkdayIdsSchema.parse(documentIds);
  const text = parseArchiveReason(reason, ids.length);

  for (const documentId of ids) {
    const workday = await findWorkdayById(documentId);
    if (!workday) throw new Error("notFound");
  }

  await archiveWorkdays(ids, text);
  await auditSuccess({
    route: WORKDAYS_LIST_PATH,
    verb: "bulkArchived",
    entity: "workdays",
    quantity: ids.length,
  });
  invalidateWorkdays();
}

export async function bulkReactivateWorkdays(
  documentIds: string[],
): Promise<void> {
  await assertCanDeactivate();
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
  invalidateWorkdays();
}

export async function bulkDeleteWorkdays(documentIds: string[]): Promise<void> {
  await assertCanDelete();
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
