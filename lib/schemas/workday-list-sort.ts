import { z } from "zod";

export const WORKDAY_LIST_SORT_COLUMNS = [
  "action",
  "scope",
  "validity",
  "slots",
  "createdAt",
] as const;

export const WORKDAY_LIST_SORT_DIRECTIONS = ["asc", "desc"] as const;

export const WORKDAY_LIST_DEFAULT_SORT_COLUMN = "createdAt" as const;
export const WORKDAY_LIST_DEFAULT_SORT_DIRECTION = "desc" as const;

export const workdayListSortSchema = z.object({
  column: z
    .enum(WORKDAY_LIST_SORT_COLUMNS)
    .default(WORKDAY_LIST_DEFAULT_SORT_COLUMN),
  direction: z
    .enum(WORKDAY_LIST_SORT_DIRECTIONS)
    .default(WORKDAY_LIST_DEFAULT_SORT_DIRECTION),
});

export type WorkdayListSortColumn = z.infer<
  typeof workdayListSortSchema
>["column"];
export type WorkdayListSortDirection = z.infer<
  typeof workdayListSortSchema
>["direction"];
export type WorkdayListSort = z.infer<typeof workdayListSortSchema>;

export function nextWorkdayListSort(
  current: WorkdayListSort,
  column: WorkdayListSortColumn,
): WorkdayListSort {
  if (current.column !== column) {
    return { column, direction: "asc" };
  }
  return {
    column,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

export function isDefaultWorkdayListSort(sort: WorkdayListSort): boolean {
  return (
    sort.column === WORKDAY_LIST_DEFAULT_SORT_COLUMN &&
    sort.direction === WORKDAY_LIST_DEFAULT_SORT_DIRECTION
  );
}
