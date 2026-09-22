import { unstable_cache } from "next/cache";

import type { ActivityRow } from "@/components/activities/types";
import {
  listActivitiesPaged,
  type ActivityListItem,
} from "@/lib/repos/activities";
import {
  ACTIVITY_LIST_PAGE_SIZE,
  type ActivityListFilters,
} from "@/lib/schemas/activity-list-filters";
import { activityListFilterKey } from "@/lib/activities/activity-list-params";

export const ACTIVITY_LIST_CACHE_TAG = "drizzle:activities";

export type ActivityListPageResult = {
  activities: ActivityRow[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

function mapItem(item: ActivityListItem): ActivityRow {
  return {
    documentId: item.id,
    action: item.action,
    timestamp: item.timestamp.toISOString(),
    qty: item.qty,
    active: item.active,
    currencyAwarded: item.currencyAwarded,
    colaboratorId: item.colaboratorId,
    colaboratorName: item.colaboratorName,
    colaboratorCode: item.colaboratorCode,
    subTaskId: item.subTaskId,
    subTaskName: item.subTaskName,
    taskName: item.taskName,
    taskQty: item.taskQty,
    taskCrmItemKey: item.taskCrmItemKey,
    taskDeliveryDate: item.taskDeliveryDate,
  };
}

async function loadActivityListPageImpl(
  filters: ActivityListFilters,
  page: number,
): Promise<ActivityListPageResult> {
  const resolvedPage = Math.max(1, page);
  const { items, total } = await listActivitiesPaged({
    q: filters.q,
    page: resolvedPage,
    pageSize: ACTIVITY_LIST_PAGE_SIZE,
    sort: { column: filters.column, direction: filters.direction },
    showArchived: filters.showArchived,
    actions: filters.actions,
    from: filters.from,
    to: filters.to,
  });
  const pageCount = Math.max(1, Math.ceil(total / ACTIVITY_LIST_PAGE_SIZE));
  return {
    activities: items.map(mapItem),
    page: resolvedPage,
    pageCount,
    hasMore: resolvedPage < pageCount,
  };
}

export async function loadActivityListPage(
  filters: ActivityListFilters,
  page: number,
): Promise<ActivityListPageResult> {
  const filterKey = activityListFilterKey(filters);
  const resolvedPage = Math.max(1, page);
  const cached = unstable_cache(
    async () => loadActivityListPageImpl(filters, resolvedPage),
    ["activity-list-page", filterKey, String(resolvedPage)],
    { tags: [ACTIVITY_LIST_CACHE_TAG] },
  );
  return cached();
}

/** Bypasses `unstable_cache` for explicit client refresh after mutations. */
export async function reloadActivityListPage(
  filters: ActivityListFilters,
  page: number,
): Promise<ActivityListPageResult> {
  return loadActivityListPageImpl(filters, Math.max(1, page));
}
