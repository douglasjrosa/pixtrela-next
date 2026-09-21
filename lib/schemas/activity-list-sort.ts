import { z } from "zod";

import { ACTIVITY_ACTIONS } from "./activity";

export const ACTIVITY_LIST_SORT_COLUMNS = [
  "action",
  "colaborator",
  "timestamp",
  "qty",
  "subtask",
] as const;

export const ACTIVITY_LIST_SORT_DIRECTIONS = ["asc", "desc"] as const;

export const ACTIVITY_LIST_DEFAULT_SORT_COLUMN = "timestamp" as const;
export const ACTIVITY_LIST_DEFAULT_SORT_DIRECTION = "desc" as const;

export const activityListSortSchema = z.object({
  column: z
    .enum(ACTIVITY_LIST_SORT_COLUMNS)
    .default(ACTIVITY_LIST_DEFAULT_SORT_COLUMN),
  direction: z
    .enum(ACTIVITY_LIST_SORT_DIRECTIONS)
    .default(ACTIVITY_LIST_DEFAULT_SORT_DIRECTION),
});

export type ActivityListSortColumn = z.infer<
  typeof activityListSortSchema
>["column"];
export type ActivityListSortDirection = z.infer<
  typeof activityListSortSchema
>["direction"];
export type ActivityListSort = z.infer<typeof activityListSortSchema>;

export function nextActivityListSort(
  current: ActivityListSort,
  column: ActivityListSortColumn,
): ActivityListSort {
  if (current.column !== column) {
    return { column, direction: "asc" };
  }
  return {
    column,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

export function isDefaultActivityListSort(sort: ActivityListSort): boolean {
  return (
    sort.column === ACTIVITY_LIST_DEFAULT_SORT_COLUMN &&
    sort.direction === ACTIVITY_LIST_DEFAULT_SORT_DIRECTION
  );
}

export const activityActionFilterSchema = z.enum(ACTIVITY_ACTIONS);
