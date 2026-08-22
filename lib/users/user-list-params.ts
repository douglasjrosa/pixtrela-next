import {
  USER_LIST_SEARCH_MIN_CHARS,
  userListFiltersSchema,
  type UserListFilters,
} from "@/lib/schemas/user-list-filters";
import {
  isDefaultUserListSort,
  USER_LIST_DEFAULT_SORT_COLUMN,
  USER_LIST_DEFAULT_SORT_DIRECTION,
  USER_LIST_SORT_COLUMNS,
  USER_LIST_SORT_DIRECTIONS,
} from "@/lib/schemas/user-list-sort";

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

export function defaultUserListFilters(): UserListFilters {
  return userListFiltersSchema.parse({});
}

function parseSortColumn(
  raw: string | undefined,
): (typeof USER_LIST_SORT_COLUMNS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return USER_LIST_SORT_COLUMNS.find((column) => column === raw.trim());
}

function parseSortDirection(
  raw: string | undefined,
): (typeof USER_LIST_SORT_DIRECTIONS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return USER_LIST_SORT_DIRECTIONS.find(
    (direction) => direction === raw.trim(),
  );
}

/**
 * Parses URL search params into user list filters.
 * Missing params use empty defaults (no q) and default sort.
 */
export function parseUserListSearchParams(
  params: SearchParamsRecord,
): UserListFilters {
  const qRaw = firstParam(params.q)?.trim();
  const sortColumn = parseSortColumn(firstParam(params.sort));
  const sortDirection = parseSortDirection(firstParam(params.dir));

  const showArchived = firstParam(params.archived) === "1";

  const result = userListFiltersSchema.safeParse({
    q:
      qRaw && qRaw.length >= USER_LIST_SEARCH_MIN_CHARS ? qRaw : undefined,
    column: sortColumn ?? USER_LIST_DEFAULT_SORT_COLUMN,
    direction: sortDirection ?? USER_LIST_DEFAULT_SORT_DIRECTION,
    showArchived,
  });

  if (!result.success) {
    return defaultUserListFilters();
  }
  return result.data;
}

/**
 * Serializes filters to URLSearchParams, omitting empty and default values.
 */
export function serializeUserListSearchParams(
  filters: UserListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (
    !isDefaultUserListSort({
      column: filters.column,
      direction: filters.direction,
    })
  ) {
    params.set("sort", filters.column);
    params.set("dir", filters.direction);
  }
  if (filters.showArchived) {
    params.set("archived", "1");
  }
  return params;
}

/** Stable key for remount/reset when filters or sort change. */
export function userListFilterKey(filters: UserListFilters): string {
  return [
    filters.q ?? "",
    filters.column,
    filters.direction,
    filters.showArchived ? "1" : "0",
  ].join("|");
}
