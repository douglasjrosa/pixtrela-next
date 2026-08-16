import {
  AWARD_LIST_SEARCH_MIN_CHARS,
  awardListFiltersSchema,
  type AwardListFilters,
} from "@/lib/schemas/award-list-filters";
import {
  isDefaultAwardListSort,
  AWARD_LIST_DEFAULT_SORT_COLUMN,
  AWARD_LIST_DEFAULT_SORT_DIRECTION,
  AWARD_LIST_SORT_COLUMNS,
  AWARD_LIST_SORT_DIRECTIONS,
} from "@/lib/schemas/award-list-sort";

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

export function defaultAwardListFilters(): AwardListFilters {
  return awardListFiltersSchema.parse({});
}

function parseSortColumn(
  raw: string | undefined,
): (typeof AWARD_LIST_SORT_COLUMNS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return AWARD_LIST_SORT_COLUMNS.find((column) => column === raw.trim());
}

function parseSortDirection(
  raw: string | undefined,
): (typeof AWARD_LIST_SORT_DIRECTIONS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return AWARD_LIST_SORT_DIRECTIONS.find(
    (direction) => direction === raw.trim(),
  );
}

/**
 * Parses URL search params into award list filters.
 * Missing params use empty defaults (no q) and default sort.
 */
export function parseAwardListSearchParams(
  params: SearchParamsRecord,
): AwardListFilters {
  const qRaw = firstParam(params.q)?.trim();
  const sortColumn = parseSortColumn(firstParam(params.sort));
  const sortDirection = parseSortDirection(firstParam(params.dir));

  const result = awardListFiltersSchema.safeParse({
    q:
      qRaw && qRaw.length >= AWARD_LIST_SEARCH_MIN_CHARS ? qRaw : undefined,
    column: sortColumn ?? AWARD_LIST_DEFAULT_SORT_COLUMN,
    direction: sortDirection ?? AWARD_LIST_DEFAULT_SORT_DIRECTION,
  });

  if (!result.success) {
    return defaultAwardListFilters();
  }
  return result.data;
}

/**
 * Serializes filters to URLSearchParams, omitting empty and default values.
 */
export function serializeAwardListSearchParams(
  filters: AwardListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (
    !isDefaultAwardListSort({
      column: filters.column,
      direction: filters.direction,
    })
  ) {
    params.set("sort", filters.column);
    params.set("dir", filters.direction);
  }
  return params;
}

/** Stable key for remount/reset when filters or sort change. */
export function awardListFilterKey(filters: AwardListFilters): string {
  return [filters.q ?? "", filters.column, filters.direction].join("|");
}
