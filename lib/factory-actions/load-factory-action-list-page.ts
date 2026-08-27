import { cache } from "react";

import type { FactoryAction } from "@/lib/business/factory-action";
import { listFactoryActionsPaged } from "@/lib/repos/factory-actions";
import {
  FACTORY_ACTION_LIST_PAGE_SIZE,
  type FactoryActionListFilters,
} from "@/lib/schemas/factory-action-list-filters";
import { factoryActionListFilterKey } from "@/lib/factory-actions/factory-action-list-params";

export type FactoryActionListPageResult = {
  actions: FactoryAction[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

const loadFactoryActionListPageCached = cache(
  async (
    _filterKey: string,
    page: number,
    filters: FactoryActionListFilters,
  ): Promise<FactoryActionListPageResult> => {
    const resolvedPage = Math.max(1, page);
    const { items, total } = await listFactoryActionsPaged({
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
  },
);

export async function loadFactoryActionListPage(
  filters: FactoryActionListFilters,
  page: number,
): Promise<FactoryActionListPageResult> {
  return loadFactoryActionListPageCached(
    factoryActionListFilterKey(filters),
    page,
    filters,
  );
}
