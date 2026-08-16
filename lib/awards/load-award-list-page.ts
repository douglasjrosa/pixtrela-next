import { cache } from "react";

import type { AwardRow } from "@/components/awards/types";
import { listAwardsPage } from "@/lib/repos/awards";
import {
  AWARD_LIST_PAGE_SIZE,
  type AwardListFilters,
} from "@/lib/schemas/award-list-filters";
import { awardListFilterKey } from "@/lib/awards/award-list-params";
import { mapAwardListItemToRow } from "@/lib/awards/map-award-row";

export type AwardListPageResult = {
  awards: AwardRow[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

const loadAwardListPageCached = cache(
  async (
    _filterKey: string,
    page: number,
    filters: AwardListFilters,
  ): Promise<AwardListPageResult> => {
    const resolvedPage = Math.max(1, page);
    const { items, total } = await listAwardsPage({
      q: filters.q,
      page: resolvedPage,
      pageSize: AWARD_LIST_PAGE_SIZE,
      sort: { column: filters.column, direction: filters.direction },
    });
    const pageCount = Math.max(1, Math.ceil(total / AWARD_LIST_PAGE_SIZE));
    return {
      awards: items.map(mapAwardListItemToRow),
      page: resolvedPage,
      pageCount,
      hasMore: resolvedPage < pageCount,
    };
  },
);

/**
 * Loads one page of awards from Drizzle.
 * Deduped per request via React.cache keyed by filterKey + page.
 */
export async function loadAwardListPage(
  filters: AwardListFilters,
  page: number,
): Promise<AwardListPageResult> {
  return loadAwardListPageCached(awardListFilterKey(filters), page, filters);
}
