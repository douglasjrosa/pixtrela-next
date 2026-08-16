import { cache } from "react";

import type { TeamRow } from "@/components/teams/types";
import { listTeamsPage } from "@/lib/repos/teams";
import {
  TEAM_LIST_PAGE_SIZE,
  type TeamListFilters,
} from "@/lib/schemas/team-list-filters";
import { mapTeamWithMembersToRow } from "@/lib/teams/map-team-row";
import { teamListFilterKey } from "@/lib/teams/team-list-params";

export type TeamListPageResult = {
  teams: TeamRow[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

const loadTeamListPageCached = cache(
  async (
    _filterKey: string,
    page: number,
    filters: TeamListFilters,
  ): Promise<TeamListPageResult> => {
    const resolvedPage = Math.max(1, page);
    const { items, total } = await listTeamsPage({
      q: filters.q,
      page: resolvedPage,
      pageSize: TEAM_LIST_PAGE_SIZE,
      sort: { column: filters.column, direction: filters.direction },
      showArchived: filters.showArchived,
    });
    const pageCount = Math.max(1, Math.ceil(total / TEAM_LIST_PAGE_SIZE));
    return {
      teams: items.map(mapTeamWithMembersToRow),
      page: resolvedPage,
      pageCount,
      hasMore: resolvedPage < pageCount,
    };
  },
);

/**
 * Loads one page of active teams from Drizzle.
 * Deduped per request via React.cache keyed by filterKey + page.
 */
export async function loadTeamListPage(
  filters: TeamListFilters,
  page: number,
): Promise<TeamListPageResult> {
  return loadTeamListPageCached(teamListFilterKey(filters), page, filters);
}
