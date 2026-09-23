"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateActivities,
  canDeleteActivities,
  canManageActivities,
  canViewActivities,
} from "@/lib/auth/permissions";
import {
  loadActivityListPage,
  type ActivityListPageResult,
} from "@/lib/activities/load-activity-list-page";
import { DEACTIVATION_TABLE } from "@/lib/domain/deactivation-tables";
import { auditSuccess } from "@/lib/logs/record-log";
import { findLatestDeactivationReason } from "@/lib/repos/deactivation-reasons";
import {
  archiveActivities,
  createActivity as createActivityRepo,
  deleteActivityById,
  getActivityById,
  reactivateActivity as reactivateActivityRepo,
  updateActivityFields,
} from "@/lib/repos/activities";
import {
  adminActivityFormSchema,
  type AdminActivityFormInput,
} from "@/lib/schemas/admin-activity";
import { activityListFiltersSchema } from "@/lib/schemas/activity-list-filters";
import { parseArchiveReason } from "@/lib/schemas/archive-with-reason";
import { bulkDocumentIdsSchema } from "@/lib/schemas/bulk-ids";

async function assertCanView(): Promise<void> {
  const session = await auth();
  if (!canViewActivities(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageActivities(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanDeactivate(): Promise<void> {
  const session = await auth();
  if (!canDeactivateActivities(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanDelete(): Promise<void> {
  const session = await auth();
  if (!canDeleteActivities(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateActivities(): void {
  revalidateTag("drizzle:activities", "default");
  revalidateTag("drizzle:subTasks", "default");
  revalidateTag("drizzle:tasks", "default");
  revalidateTag("drizzle:balances", "default");
}

export async function loadMoreActivities(
  rawFilters: unknown,
  page: number,
): Promise<ActivityListPageResult> {
  await assertCanView();
  const filters = activityListFiltersSchema.parse(rawFilters);
  return loadActivityListPage(filters, page);
}

export async function loadActivityArchiveReason(
  documentId: string,
): Promise<string | null> {
  await assertCanView();
  const reason = await findLatestDeactivationReason(
    DEACTIVATION_TABLE.activities,
    documentId,
  );
  return reason?.text ?? null;
}

export async function createActivity(
  raw: AdminActivityFormInput,
): Promise<void> {
  await assertCanManage();
  const data = adminActivityFormSchema.parse(raw);
  await createActivityRepo(data);
  await auditSuccess({
    route: "/activities",
    verb: "created",
    entity: "activity",
    name: `${data.action} · ${data.qty}`,
    after: `${data.date} ${data.time}`,
  });
  invalidateActivities();
}

export async function updateActivity(
  documentId: string,
  raw: AdminActivityFormInput,
): Promise<void> {
  await assertCanManage();
  const data = adminActivityFormSchema.parse(raw);
  const before = await getActivityById(documentId);
  await updateActivityFields(documentId, data);
  await auditSuccess({
    route: "/activities",
    verb: "updated",
    entity: "activity",
    name: `${data.action} · ${data.qty}`,
    before: before ? `${before.action} · ${before.qty}` : null,
    after: `${data.action} · ${data.qty}`,
  });
  invalidateActivities();
}

export async function reactivateActivity(documentId: string): Promise<void> {
  await assertCanDeactivate();
  const activity = await getActivityById(documentId);
  await reactivateActivityRepo(documentId);
  await auditSuccess({
    route: "/activities",
    verb: "reactivated",
    entity: "activity",
    name: activity ? `${activity.action} · ${activity.qty}` : null,
  });
  invalidateActivities();
}

export async function bulkDeactivateActivities(
  documentIds: string[],
  reason: string,
): Promise<void> {
  await assertCanDeactivate();
  const ids = bulkDocumentIdsSchema.parse(documentIds);
  const text = parseArchiveReason(reason, ids.length);
  await archiveActivities(ids, text);
  await auditSuccess({
    route: "/activities",
    verb: "bulkArchived",
    entity: "activities",
    quantity: ids.length,
  });
  invalidateActivities();
}

export async function bulkDeleteActivities(
  documentIds: string[],
): Promise<void> {
  await assertCanDelete();
  const ids = bulkDocumentIdsSchema.parse(documentIds);
  for (const documentId of ids) {
    const activity = await getActivityById(documentId);
    if (!activity) throw new Error("activityNotFound");
    if (activity.active) throw new Error("activeActivity");
    await deleteActivityById(documentId);
  }
  await auditSuccess({
    route: "/activities",
    verb: "bulkDeleted",
    entity: "activities",
    quantity: ids.length,
  });
  invalidateActivities();
}
