import { z } from "zod";

export const TEAM_LIST_SORT_COLUMNS = [
  "name",
  "since",
  "untill",
  "exchangePeriod",
  "leader",
  "members",
] as const;

export const TEAM_LIST_SORT_DIRECTIONS = ["asc", "desc"] as const;

export const TEAM_LIST_DEFAULT_SORT_COLUMN = "name" as const;
export const TEAM_LIST_DEFAULT_SORT_DIRECTION = "asc" as const;

export const teamListSortSchema = z.object({
  column: z
    .enum(TEAM_LIST_SORT_COLUMNS)
    .default(TEAM_LIST_DEFAULT_SORT_COLUMN),
  direction: z
    .enum(TEAM_LIST_SORT_DIRECTIONS)
    .default(TEAM_LIST_DEFAULT_SORT_DIRECTION),
});

export type TeamListSortColumn = z.infer<typeof teamListSortSchema>["column"];
export type TeamListSortDirection = z.infer<
  typeof teamListSortSchema
>["direction"];
export type TeamListSort = z.infer<typeof teamListSortSchema>;

export function nextTeamListSort(
  current: TeamListSort,
  column: TeamListSortColumn,
): TeamListSort {
  if (current.column !== column) {
    return { column, direction: "asc" };
  }
  return {
    column,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

export function isDefaultTeamListSort(sort: TeamListSort): boolean {
  return (
    sort.column === TEAM_LIST_DEFAULT_SORT_COLUMN &&
    sort.direction === TEAM_LIST_DEFAULT_SORT_DIRECTION
  );
}
