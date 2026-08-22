import { cache } from "react";

import type { UserRow } from "@/components/users/types";
import { listUsersPage } from "@/lib/repos/users";
import {
  USER_LIST_PAGE_SIZE,
  type UserListFilters,
} from "@/lib/schemas/user-list-filters";
import { mapUserRecordToRow } from "@/lib/users/map-user-row";
import { userListFilterKey } from "@/lib/users/user-list-params";

export type UserListPageResult = {
  users: UserRow[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

const loadUserListPageCached = cache(
  async (
    _filterKey: string,
    page: number,
    filters: UserListFilters,
  ): Promise<UserListPageResult> => {
    const resolvedPage = Math.max(1, page);
    const { items, total } = await listUsersPage({
      q: filters.q,
      page: resolvedPage,
      pageSize: USER_LIST_PAGE_SIZE,
      sort: { column: filters.column, direction: filters.direction },
      showArchived: filters.showArchived,
    });
    const pageCount = Math.max(1, Math.ceil(total / USER_LIST_PAGE_SIZE));
    return {
      users: items.map(mapUserRecordToRow),
      page: resolvedPage,
      pageCount,
      hasMore: resolvedPage < pageCount,
    };
  },
);

/**
 * Loads one page of users from Drizzle.
 * Deduped per request via React.cache keyed by filterKey + page.
 */
export async function loadUserListPage(
  filters: UserListFilters,
  page: number,
): Promise<UserListPageResult> {
  return loadUserListPageCached(userListFilterKey(filters), page, filters);
}
