import type { MaterialFlagListFilters } from "@/lib/schemas/material-flag";
import { materialFlagListFiltersSchema } from "@/lib/schemas/material-flag";

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

export function parseFlagListSearchParams(
  params: SearchParamsRecord,
): MaterialFlagListFilters {
  const result = materialFlagListFiltersSchema.safeParse({
    q: firstParam(params.q),
    categoryId: firstParam(params.categoryId),
    column: firstParam(params.sort) ?? "code",
    direction: firstParam(params.dir) ?? "asc",
  });
  if (!result.success) {
    return materialFlagListFiltersSchema.parse({});
  }
  return result.data;
}

export function serializeFlagListSearchParams(
  filters: MaterialFlagListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.column !== "code" || filters.direction !== "asc") {
    params.set("sort", filters.column);
    params.set("dir", filters.direction);
  }
  return params;
}

export function flagListFilterKey(filters: MaterialFlagListFilters): string {
  return [
    filters.q ?? "",
    filters.categoryId ?? "",
    filters.column,
    filters.direction,
  ].join("|");
}
