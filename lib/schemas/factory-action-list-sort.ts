import { z } from "zod";

export const FACTORY_ACTION_LIST_SORT_COLUMNS = [
  "name",
  "unitTime",
  "qtyQuestion",
] as const;

export const FACTORY_ACTION_LIST_SORT_DIRECTIONS = ["asc", "desc"] as const;

export const FACTORY_ACTION_LIST_DEFAULT_SORT_COLUMN = "name" as const;
export const FACTORY_ACTION_LIST_DEFAULT_SORT_DIRECTION = "asc" as const;

export const factoryActionListSortSchema = z.object({
  column: z
    .enum(FACTORY_ACTION_LIST_SORT_COLUMNS)
    .default(FACTORY_ACTION_LIST_DEFAULT_SORT_COLUMN),
  direction: z
    .enum(FACTORY_ACTION_LIST_SORT_DIRECTIONS)
    .default(FACTORY_ACTION_LIST_DEFAULT_SORT_DIRECTION),
});

export type FactoryActionListSortColumn = z.infer<
  typeof factoryActionListSortSchema
>["column"];
export type FactoryActionListSortDirection = z.infer<
  typeof factoryActionListSortSchema
>["direction"];
export type FactoryActionListSort = z.infer<typeof factoryActionListSortSchema>;

export function nextFactoryActionListSort(
  current: FactoryActionListSort,
  column: FactoryActionListSortColumn,
): FactoryActionListSort {
  if (current.column !== column) {
    return { column, direction: "asc" };
  }
  return {
    column,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

export function isDefaultFactoryActionListSort(
  sort: FactoryActionListSort,
): boolean {
  return (
    sort.column === FACTORY_ACTION_LIST_DEFAULT_SORT_COLUMN &&
    sort.direction === FACTORY_ACTION_LIST_DEFAULT_SORT_DIRECTION
  );
}
