import {
  nextAwardListSort,
  type AwardListSortColumn,
} from "@/lib/schemas/award-list-sort";
import type { AwardListFilters } from "@/lib/schemas/award-list-filters";

import { serializeAwardListSearchParams } from "./award-list-params";

export const AWARDS_LIST_PATH = "/awards";

/**
 * Builds an `/awards` href that toggles sort for the given column.
 */
export function buildAwardListSortHref(
  filters: AwardListFilters,
  column: AwardListSortColumn,
): string {
  const next = nextAwardListSort(
    { column: filters.column, direction: filters.direction },
    column,
  );
  return buildAwardListHref({
    ...filters,
    column: next.column,
    direction: next.direction,
  });
}

/** Builds an `/awards` href from current filters. */
export function buildAwardListHref(filters: AwardListFilters): string {
  const params = serializeAwardListSearchParams(filters);
  const query = params.toString();
  return query ? `${AWARDS_LIST_PATH}?${query}` : AWARDS_LIST_PATH;
}
