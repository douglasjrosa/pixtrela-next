import { z } from "zod";

export const TEMPLATE_LIST_SORT_COLUMNS = [
  "name",
  "code",
  "subTaskCount",
] as const;

export const TEMPLATE_LIST_SORT_DIRECTIONS = ["asc", "desc"] as const;

export const TEMPLATE_LIST_DEFAULT_SORT_COLUMN = "name" as const;
export const TEMPLATE_LIST_DEFAULT_SORT_DIRECTION = "asc" as const;

export const templateListSortSchema = z.object({
  column: z
    .enum(TEMPLATE_LIST_SORT_COLUMNS)
    .default(TEMPLATE_LIST_DEFAULT_SORT_COLUMN),
  direction: z
    .enum(TEMPLATE_LIST_SORT_DIRECTIONS)
    .default(TEMPLATE_LIST_DEFAULT_SORT_DIRECTION),
});

export type TemplateListSortColumn = z.infer<
  typeof templateListSortSchema
>["column"];
export type TemplateListSortDirection = z.infer<
  typeof templateListSortSchema
>["direction"];
export type TemplateListSort = z.infer<typeof templateListSortSchema>;

export function nextTemplateListSort(
  current: TemplateListSort,
  column: TemplateListSortColumn,
): TemplateListSort {
  if (current.column !== column) {
    return { column, direction: "asc" };
  }
  return {
    column,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

export function isDefaultTemplateListSort(sort: TemplateListSort): boolean {
  return (
    sort.column === TEMPLATE_LIST_DEFAULT_SORT_COLUMN &&
    sort.direction === TEMPLATE_LIST_DEFAULT_SORT_DIRECTION
  );
}
