"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import { LOG_PAGE_SIZE } from "@/lib/logs/constants";
import { deleteLogsByIds, listLogs, type LogListItem } from "@/lib/repos/logs";
import { bulkDocumentIdsSchema } from "@/lib/schemas/bulk-ids";
import { logListFiltersSchema } from "@/lib/schemas/log-list-filters";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

export async function loadMoreLogs(
  rawFilters: unknown,
  page: number,
): Promise<{ items: LogListItem[]; hasMore: boolean }> {
  await assertCanManage();
  const filters = logListFiltersSchema.parse(rawFilters);
  const result = await listLogs(filters, page);
  return {
    items: result.items,
    hasMore: page * LOG_PAGE_SIZE < result.total,
  };
}

export async function deleteLogs(documentIds: string[]): Promise<void> {
  await assertCanManage();
  const ids = bulkDocumentIdsSchema.parse(documentIds);
  await deleteLogsByIds(ids);
  revalidateTag("drizzle:logs", "default");
}
