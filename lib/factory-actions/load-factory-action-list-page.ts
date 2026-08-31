import { unstable_cache } from "next/cache";

import type { FactoryAction } from "@/lib/business/factory-action";
import { listFactoryActionsPaged } from "@/lib/repos/factory-actions";
import {
  FACTORY_ACTION_LIST_PAGE_SIZE,
  type FactoryActionListFilters,
} from "@/lib/schemas/factory-action-list-filters";
import { factoryActionListFilterKey } from "@/lib/factory-actions/factory-action-list-params";

export const FACTORY_ACTION_LIST_CACHE_TAG = "drizzle:factory-actions";

export type FactoryActionListPageResult = {
  actions: FactoryAction[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

async function loadFactoryActionListPageImpl(
  filters: FactoryActionListFilters,
  page: number,
): Promise<FactoryActionListPageResult> {
  const resolvedPage = Math.max(1, page);
  const { items, total } = await listFactoryActionsPaged({
    q: filters.q,
    showArchived: filters.showArchived,
    page: resolvedPage,
    pageSize: FACTORY_ACTION_LIST_PAGE_SIZE,
    sort: { column: filters.column, direction: filters.direction },
  });
  const pageCount = Math.max(
    1,
    Math.ceil(total / FACTORY_ACTION_LIST_PAGE_SIZE),
  );
  return {
    actions: items,
    page: resolvedPage,
    pageCount,
    hasMore: resolvedPage < pageCount,
  };
}

export async function loadFactoryActionListPage(
  filters: FactoryActionListFilters,
  page: number,
): Promise<FactoryActionListPageResult> {
  const filterKey = factoryActionListFilterKey(filters);
  const resolvedPage = Math.max(1, page);
  const cached = unstable_cache(
    async () => loadFactoryActionListPageImpl(filters, resolvedPage),
    ["factory-action-list-page", filterKey, String(resolvedPage)],
    { tags: [FACTORY_ACTION_LIST_CACHE_TAG] },
  );
  return cached();
}
