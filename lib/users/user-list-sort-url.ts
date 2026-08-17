import {
  nextUserListSort,
  type UserListSortColumn,
} from "@/lib/schemas/user-list-sort";
import type { UserListFilters } from "@/lib/schemas/user-list-filters";

import { serializeUserListSearchParams } from "./user-list-params";

export const USERS_LIST_PATH = "/users";

/**
 * Builds a `/users` href that toggles sort for the given column.
 */
export function buildUserListSortHref(
  filters: UserListFilters,
  column: UserListSortColumn,
): string {
  const next = nextUserListSort(
    { column: filters.column, direction: filters.direction },
    column,
  );
  return buildUserListHref({
    ...filters,
    column: next.column,
    direction: next.direction,
  });
}

/** Builds a `/users` href from current filters. */
export function buildUserListHref(filters: UserListFilters): string {
  const params = serializeUserListSearchParams(filters);
  const query = params.toString();
  return query ? `${USERS_LIST_PATH}?${query}` : USERS_LIST_PATH;
}
