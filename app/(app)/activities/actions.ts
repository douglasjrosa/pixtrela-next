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
  invalidateActivities();
}

export async function updateActivity(
  documentId: string,
  raw: AdminActivityFormInput,
): Promise<void> {
  await assertCanManage();
  const data = adminActivityFormSchema.parse(raw);
  await updateActivityFields(documentId, data);
  invalidateActivities();
}

export async function reactivateActivity(documentId: string): Promise<void> {
  await assertCanDeactivate();
  await reactivateActivityRepo(documentId);
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
  invalidateActivities();
}
