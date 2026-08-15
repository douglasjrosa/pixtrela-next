import type { TemplateListRow } from "@/components/templates/types";
import {
  listTemplateTasks,
  type TemplateTaskListItem,
} from "@/lib/repos/templates";
import {
  TEMPLATE_LIST_PAGE_SIZE,
  type TemplateListFilters,
} from "@/lib/schemas/template-list-filters";

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
  };
}

/**
 * Loads one page of filtered template-tasks from Drizzle repos.
 */
export async function loadTemplateListPage(
  filters: TemplateListFilters,
  page: number,
): Promise<TemplateListPageResult> {
  const resolvedPage = Math.max(1, page);
  const { items, total } = await listTemplateTasks({
    q: filters.q,
    page: resolvedPage,
    pageSize: TEMPLATE_LIST_PAGE_SIZE,
  });
  const pageCount = Math.max(1, Math.ceil(total / TEMPLATE_LIST_PAGE_SIZE));
  return {
    templates: items.map(mapDrizzleItem),
    page: resolvedPage,
    pageCount,
    hasMore: resolvedPage < pageCount,
  };
}
