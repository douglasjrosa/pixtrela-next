import { unstable_cache } from "next/cache";

import type { WorkdayRow } from "@/components/workdays/types";
import { listWorkdaysPage } from "@/lib/repos/workdays";
import {
  WORKDAY_LIST_PAGE_SIZE,
  type WorkdayListFilters,
} from "@/lib/schemas/workday-list-filters";

import { mapWorkdayToRow } from "./map-workday-row";
import { workdayListFilterKey } from "./workday-list-params";

export const WORKDAY_LIST_CACHE_TAG = "drizzle:workdays";

export type WorkdayListPageResult = {
  workdays: WorkdayRow[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

async function loadWorkdayListPageImpl(
  filters: WorkdayListFilters,
  page: number,
): Promise<WorkdayListPageResult> {
  const resolvedPage = Math.max(1, page);
  const { items, total } = await listWorkdaysPage({
    q: filters.q,
    action: filters.action,
    scope: filters.scope,
    page: resolvedPage,
    pageSize: WORKDAY_LIST_PAGE_SIZE,
    sort: { column: filters.column, direction: filters.direction },
    showArchived: filters.showArchived,
  });
  const pageCount = Math.max(1, Math.ceil(total / WORKDAY_LIST_PAGE_SIZE));
  return {
    workdays: items.map(mapWorkdayToRow),
    page: resolvedPage,
    pageCount,
    hasMore: resolvedPage < pageCount,
  };
}

export async function loadWorkdayListPage(
  filters: WorkdayListFilters,
  page: number,
): Promise<WorkdayListPageResult> {
  const filterKey = workdayListFilterKey(filters);
  const resolvedPage = Math.max(1, page);
  const cached = unstable_cache(
    async () => loadWorkdayListPageImpl(filters, resolvedPage),
    ["workday-list-page", filterKey, String(resolvedPage)],
    { tags: [WORKDAY_LIST_CACHE_TAG] },
  );
  return cached();
}
