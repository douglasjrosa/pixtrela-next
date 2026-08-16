import {
  nextTaskListSort,
  type TaskListSortColumn,
} from "@/lib/schemas/task-list-sort";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";

import { serializeTaskListSearchParams } from "./task-list-params";

export type TaskListUrlOptions = {
  selectMode?: boolean;
  now?: Date;
};

/**
 * Builds a `/tasks` href that toggles sort for the given column.
 */
export function buildTaskListSortHref(
  filters: TaskListFilters,
  column: TaskListSortColumn,
  options: TaskListUrlOptions = {},
): string {
  const next = nextTaskListSort(
    { column: filters.column, direction: filters.direction },
    column,
  );
  return buildTaskListHref(
    {
      ...filters,
      column: next.column,
      direction: next.direction,
    },
    options,
  );
}

/**
 * Builds a `/tasks` href from current filters and optional select mode.
 */
export function buildTaskListHref(
  filters: TaskListFilters,
  options: TaskListUrlOptions = {},
): string {
  const params = serializeTaskListSearchParams(filters, options.now);
  if (options.selectMode) {
    params.set("select", "1");
  }
  const query = params.toString();
  return query ? `/tasks?${query}` : "/tasks";
}
