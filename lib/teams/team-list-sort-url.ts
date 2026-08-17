import {
  nextTeamListSort,
  type TeamListSortColumn,
} from "@/lib/schemas/team-list-sort";
import type { TeamListFilters } from "@/lib/schemas/team-list-filters";

import { serializeTeamListSearchParams } from "./team-list-params";

export const TEAMS_LIST_PATH = "/teams";

/**
 * Builds a `/teams` href that toggles sort for the given column.
 */
export function buildTeamListSortHref(
  filters: TeamListFilters,
  column: TeamListSortColumn,
): string {
  const next = nextTeamListSort(
    { column: filters.column, direction: filters.direction },
    column,
  );
  return buildTeamListHref({
    ...filters,
    column: next.column,
    direction: next.direction,
  });
}

/** Builds a `/teams` href from current filters. */
export function buildTeamListHref(filters: TeamListFilters): string {
  const params = serializeTeamListSearchParams(filters);
  const query = params.toString();
  return query ? `${TEAMS_LIST_PATH}?${query}` : TEAMS_LIST_PATH;
}
