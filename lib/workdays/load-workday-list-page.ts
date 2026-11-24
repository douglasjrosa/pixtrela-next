import { unstable_cache } from "next/cache";

import type { WorkdayRow } from "@/components/workdays/types";
import { listWorkdaysPage } from "@/lib/repos/workdays";
import {
  WORKDAY_LIST_PAGE_SIZE,
  type WorkdayListFilters,
} from "@/lib/schemas/workday-list-filters";

import { mapWorkdayToRow } from "./map-workday-row";
import type { WorkdayListViewerContext } from "./resolve-workday-viewer";
import { workdayListFilterKey } from "./workday-list-params";
import { workdayRowPermissions } from "./workday-row-permissions";

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
  viewerContext: WorkdayListViewerContext | null,
): Promise<WorkdayListPageResult> {
  const resolvedPage = Math.max(1, page);
  const { items, total } = await listWorkdaysPage({
    q: filters.q,
    action: filters.action,
    scope: filters.scope,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    page: resolvedPage,
    pageSize: WORKDAY_LIST_PAGE_SIZE,
    sort: { column: filters.column, direction: filters.direction },
    showArchived: filters.showArchived,
    viewer: viewerContext?.viewer ?? undefined,
  });
  const pageCount = Math.max(1, Math.ceil(total / WORKDAY_LIST_PAGE_SIZE));
  const role = viewerContext?.role;
  return {
    workdays: items.map((item) =>
      mapWorkdayToRow(
        item,
        workdayRowPermissions(item, viewerContext?.writeContext ?? null, role),
      ),
    ),
    page: resolvedPage,
    pageCount,
    hasMore: resolvedPage < pageCount,
  };
}

export async function loadWorkdayListPage(
  filters: WorkdayListFilters,
  page: number,
  viewerContext: WorkdayListViewerContext | null = null,
): Promise<WorkdayListPageResult> {
  const filterKey = workdayListFilterKey(filters);
  const resolvedPage = Math.max(1, page);
  const viewerKey = viewerContext?.viewer
    ? `${viewerContext.role}:${viewerContext.viewer.userId}`
    : viewerContext?.role ?? "anon";
  const cached = unstable_cache(
    async () =>
      loadWorkdayListPageImpl(filters, resolvedPage, viewerContext),
    ["workday-list-page", filterKey, String(resolvedPage), viewerKey],
    { tags: [WORKDAY_LIST_CACHE_TAG] },
  );
  return cached();
}
