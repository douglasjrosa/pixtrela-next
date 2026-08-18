import type {
  SubTaskCategoryListFilters,
} from "@/lib/schemas/sub-task-category";
import { subTaskCategoryListFiltersSchema } from "@/lib/schemas/sub-task-category";

export type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseCategoryListSearchParams(
  params: SearchParamsRecord,
): SubTaskCategoryListFilters {
  const result = subTaskCategoryListFiltersSchema.safeParse({
    q: firstParam(params.q),
    column: firstParam(params.sort) ?? "name",
    direction: firstParam(params.dir) ?? "asc",
  });
  if (!result.success) {
    return subTaskCategoryListFiltersSchema.parse({});
  }
  return result.data;
}

export function serializeCategoryListSearchParams(
  filters: SubTaskCategoryListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.column !== "name" || filters.direction !== "asc") {
    params.set("sort", filters.column);
    params.set("dir", filters.direction);
  }
  return params;
}

export function categoryListFilterKey(
  filters: SubTaskCategoryListFilters,
): string {
  return [filters.q ?? "", filters.column, filters.direction].join("|");
}
