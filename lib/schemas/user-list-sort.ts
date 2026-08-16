import { z } from "zod";

export const USER_LIST_SORT_COLUMNS = ["name", "code", "role"] as const;

export const USER_LIST_SORT_DIRECTIONS = ["asc", "desc"] as const;

export const USER_LIST_DEFAULT_SORT_COLUMN = "name" as const;
export const USER_LIST_DEFAULT_SORT_DIRECTION = "asc" as const;

export const userListSortSchema = z.object({
  column: z
    .enum(USER_LIST_SORT_COLUMNS)
    .default(USER_LIST_DEFAULT_SORT_COLUMN),
  direction: z
    .enum(USER_LIST_SORT_DIRECTIONS)
    .default(USER_LIST_DEFAULT_SORT_DIRECTION),
});

export type UserListSortColumn = z.infer<typeof userListSortSchema>["column"];
export type UserListSortDirection = z.infer<
  typeof userListSortSchema
>["direction"];
export type UserListSort = z.infer<typeof userListSortSchema>;

export function nextUserListSort(
  current: UserListSort,
  column: UserListSortColumn,
): UserListSort {
  if (current.column !== column) {
    return { column, direction: "asc" };
  }
  return {
    column,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

export function isDefaultUserListSort(sort: UserListSort): boolean {
  return (
    sort.column === USER_LIST_DEFAULT_SORT_COLUMN &&
    sort.direction === USER_LIST_DEFAULT_SORT_DIRECTION
  );
}
