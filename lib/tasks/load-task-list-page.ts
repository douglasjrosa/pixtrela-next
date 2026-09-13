import { unstable_cache } from "next/cache";

import type { TaskRow } from "@/components/tasks/types";
import {
  listTasksPaged,
  type TaskListItem,
} from "@/lib/repos/tasks";
import {
  TASK_LIST_PAGE_SIZE,
  type TaskListFilters,
} from "@/lib/schemas/task-list-filters";
import { taskListFilterKey } from "@/lib/tasks/task-list-params";

export const TASK_LIST_CACHE_TAG = "drizzle:tasks";

export type TaskListPageResult = {
  tasks: TaskRow[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

function mapDrizzleItem(item: TaskListItem): TaskRow {
  return {
    documentId: item.id,
    crmItemKey: item.crmItemKey,
    name: item.name,
    qty: item.qty,
    deliveryDate: item.deliveryDate,
    status: item.status,
    active: item.active,
    totalExpectedTime: item.totalExpectedTime,
    totalTimeSpent: item.totalTimeSpent,
    finishedSubTaskCount: item.finishedSubTaskCount,
    totalSubTaskCount: item.totalSubTaskCount,
  };
}

async function loadTaskListPageImpl(
  filters: TaskListFilters,
  page: number,
): Promise<TaskListPageResult> {
  const resolvedPage = Math.max(1, page);
  const { items, total } = await listTasksPaged({
    q: filters.q,
    page: resolvedPage,
    pageSize: TASK_LIST_PAGE_SIZE,
    sort: { column: filters.column, direction: filters.direction },
    showArchived: filters.showArchived,
    statuses: filters.statuses,
    from: filters.from,
    to: filters.to,
  });
  const pageCount = Math.max(1, Math.ceil(total / TASK_LIST_PAGE_SIZE));
  return {
    tasks: items.map(mapDrizzleItem),
    page: resolvedPage,
    pageCount,
    hasMore: resolvedPage < pageCount,
  };
}

/**
 * Loads one page of filtered tasks from Drizzle repos.
 * Cached with `TASK_LIST_CACHE_TAG` for mutation invalidation.
 */
export async function loadTaskListPage(
  filters: TaskListFilters,
  page: number,
): Promise<TaskListPageResult> {
  const filterKey = taskListFilterKey(filters);
  const resolvedPage = Math.max(1, page);
  const cached = unstable_cache(
    async () => loadTaskListPageImpl(filters, resolvedPage),
    ["task-list-page", filterKey, String(resolvedPage)],
    { tags: [TASK_LIST_CACHE_TAG] },
  );
  return cached();
}
