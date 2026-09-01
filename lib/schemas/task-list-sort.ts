import { z } from "zod";

export const TASK_LIST_SORT_COLUMNS = [
  "crmItemKey",
  "name",
  "qty",
  "deliveryDate",
  "totalTimeSpent",
  "finishedSubTasks",
  "status",
] as const;

export const TASK_LIST_SORT_DIRECTIONS = ["asc", "desc"] as const;

export const TASK_LIST_DEFAULT_SORT_COLUMN = "deliveryDate" as const;
export const TASK_LIST_DEFAULT_SORT_DIRECTION = "asc" as const;

export const taskListSortSchema = z.object({
  column: z.enum(TASK_LIST_SORT_COLUMNS).default(TASK_LIST_DEFAULT_SORT_COLUMN),
  direction: z
    .enum(TASK_LIST_SORT_DIRECTIONS)
    .default(TASK_LIST_DEFAULT_SORT_DIRECTION),
});

export type TaskListSortColumn = z.infer<
  typeof taskListSortSchema
>["column"];
export type TaskListSortDirection = z.infer<
  typeof taskListSortSchema
>["direction"];
export type TaskListSort = z.infer<typeof taskListSortSchema>;

export function nextTaskListSort(
  current: TaskListSort,
  column: TaskListSortColumn,
): TaskListSort {
  if (current.column !== column) {
    return { column, direction: "asc" };
  }
  return {
    column,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

export function isDefaultTaskListSort(sort: TaskListSort): boolean {
  return (
    sort.column === TASK_LIST_DEFAULT_SORT_COLUMN &&
    sort.direction === TASK_LIST_DEFAULT_SORT_DIRECTION
  );
}
