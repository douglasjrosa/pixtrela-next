import {
  TEAM_LIST_SEARCH_MIN_CHARS,
  teamListFiltersSchema,
  type TeamListFilters,
} from "@/lib/schemas/team-list-filters";
import {
  isDefaultTeamListSort,
  TEAM_LIST_DEFAULT_SORT_COLUMN,
  TEAM_LIST_DEFAULT_SORT_DIRECTION,
  TEAM_LIST_SORT_COLUMNS,
  TEAM_LIST_SORT_DIRECTIONS,
} from "@/lib/schemas/team-list-sort";

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

export function defaultTeamListFilters(): TeamListFilters {
  return teamListFiltersSchema.parse({});
}

function parseSortColumn(
  raw: string | undefined,
): (typeof TEAM_LIST_SORT_COLUMNS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return TEAM_LIST_SORT_COLUMNS.find((column) => column === raw.trim());
}

function parseSortDirection(
  raw: string | undefined,
): (typeof TEAM_LIST_SORT_DIRECTIONS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return TEAM_LIST_SORT_DIRECTIONS.find(
    (direction) => direction === raw.trim(),
  );
}

/**
 * Parses URL search params into team list filters.
 * Missing params use empty defaults (no q) and default sort.
 */
export function parseTeamListSearchParams(
  params: SearchParamsRecord,
): TeamListFilters {
  const qRaw = firstParam(params.q)?.trim();
  const sortColumn = parseSortColumn(firstParam(params.sort));
  const sortDirection = parseSortDirection(firstParam(params.dir));

  const result = teamListFiltersSchema.safeParse({
    q:
      qRaw && qRaw.length >= TEAM_LIST_SEARCH_MIN_CHARS ? qRaw : undefined,
    column: sortColumn ?? TEAM_LIST_DEFAULT_SORT_COLUMN,
    direction: sortDirection ?? TEAM_LIST_DEFAULT_SORT_DIRECTION,
  });

  if (!result.success) {
    return defaultTeamListFilters();
  }
  return result.data;
}

/**
 * Serializes filters to URLSearchParams, omitting empty and default values.
 */
export function serializeTeamListSearchParams(
  filters: TeamListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (
    !isDefaultTeamListSort({
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
export function teamListFilterKey(filters: TeamListFilters): string {
  return [filters.q ?? "", filters.column, filters.direction].join("|");
}
