import { unstable_cache } from "next/cache";

import type { TemplateListRow } from "@/components/templates/types";
import {
  listTemplateTasks,
  type TemplateTaskListItem,
} from "@/lib/repos/templates";
import {
  TEMPLATE_LIST_PAGE_SIZE,
  type TemplateListFilters,
} from "@/lib/schemas/template-list-filters";
import { templateListFilterKey } from "@/lib/templates/template-list-params";

export const TEMPLATE_LIST_CACHE_TAG = "drizzle:templates";

export type TemplateListPageResult = {
  templates: TemplateListRow[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

function mapDrizzleItem(item: TemplateTaskListItem): TemplateListRow {
  return {
    documentId: item.id,
    name: item.name,
    code: item.code,
    subTaskCount: item.subTaskCount,
    active: item.active,
  };
}

async function loadTemplateListPageImpl(
  filters: TemplateListFilters,
  page: number,
): Promise<TemplateListPageResult> {
  const resolvedPage = Math.max(1, page);
  const { items, total } = await listTemplateTasks({
    q: filters.q,
    page: resolvedPage,
    pageSize: TEMPLATE_LIST_PAGE_SIZE,
    sort: { column: filters.column, direction: filters.direction },
    showArchived: filters.showArchived,
  });
  const pageCount = Math.max(1, Math.ceil(total / TEMPLATE_LIST_PAGE_SIZE));
  return {
    templates: items.map(mapDrizzleItem),
    page: resolvedPage,
    pageCount,
    hasMore: resolvedPage < pageCount,
  };
}

/**
 * Loads one page of filtered template-tasks from Drizzle repos.
 * Cached with `TEMPLATE_LIST_CACHE_TAG` for mutation invalidation.
 */
export async function loadTemplateListPage(
  filters: TemplateListFilters,
  page: number,
): Promise<TemplateListPageResult> {
  const filterKey = templateListFilterKey(filters);
  const resolvedPage = Math.max(1, page);
  const cached = unstable_cache(
    async () => loadTemplateListPageImpl(filters, resolvedPage),
    ["template-list-page", filterKey, String(resolvedPage)],
    { tags: [TEMPLATE_LIST_CACHE_TAG] },
  );
  return cached();
}
