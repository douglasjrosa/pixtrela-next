import { z } from "zod";

export const AWARD_LIST_SORT_COLUMNS = ["title", "starCost"] as const;

export const AWARD_LIST_SORT_DIRECTIONS = ["asc", "desc"] as const;

export const AWARD_LIST_DEFAULT_SORT_COLUMN = "title" as const;
export const AWARD_LIST_DEFAULT_SORT_DIRECTION = "asc" as const;

export const awardListSortSchema = z.object({
  column: z
    .enum(AWARD_LIST_SORT_COLUMNS)
    .default(AWARD_LIST_DEFAULT_SORT_COLUMN),
  direction: z
    .enum(AWARD_LIST_SORT_DIRECTIONS)
    .default(AWARD_LIST_DEFAULT_SORT_DIRECTION),
});

export type AwardListSortColumn = z.infer<
  typeof awardListSortSchema
>["column"];
export type AwardListSortDirection = z.infer<
  typeof awardListSortSchema
>["direction"];
export type AwardListSort = z.infer<typeof awardListSortSchema>;

export function nextAwardListSort(
  current: AwardListSort,
  column: AwardListSortColumn,
): AwardListSort {
  if (current.column !== column) {
    return { column, direction: "asc" };
  }
  return {
    column,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

export function isDefaultAwardListSort(sort: AwardListSort): boolean {
  return (
    sort.column === AWARD_LIST_DEFAULT_SORT_COLUMN &&
    sort.direction === AWARD_LIST_DEFAULT_SORT_DIRECTION
  );
}
