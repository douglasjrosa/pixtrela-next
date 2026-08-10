import type { TemplateListRow } from "@/components/templates/types";
import { isDrizzleBackend } from "@/lib/db/backend";
import {
  listTemplateTasks,
  type TemplateTaskListItem,
} from "@/lib/repos/templates";
import {
  TEMPLATE_LIST_PAGE_SIZE,
  type TemplateListFilters,
} from "@/lib/schemas/template-list-filters";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import { buildTemplateListQuery } from "./build-template-list-query";

interface TemplateEntity {
  documentId: string;
  name: string;
  code: string;
  subTask?: unknown[] | null;
}

interface StrapiListResponse {
  data: TemplateEntity[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export type TemplateListPageResult = {
  templates: TemplateListRow[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

function mapTemplateEntity(template: TemplateEntity): TemplateListRow {
  return {
    documentId: template.documentId,
    name: template.name,
    code: template.code,
    subTaskCount: template.subTask?.length ?? 0,
  };
}

function mapDrizzleItem(item: TemplateTaskListItem): TemplateListRow {
  return {
    documentId: item.id,
    name: item.name,
    code: item.code,
    subTaskCount: item.subTaskCount,
  };
}

async function loadDrizzleTemplateListPage(
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

/**
 * Loads one page of filtered template-tasks (Drizzle or Strapi REST).
 */
export async function loadTemplateListPage(
  filters: TemplateListFilters,
  page: number,
): Promise<TemplateListPageResult> {
  if (isDrizzleBackend()) {
    return loadDrizzleTemplateListPage(filters, page);
  }

  const res = await strapiFetch<StrapiListResponse>(
    "/template-tasks",
    { strapiCache: { tags: [STRAPI_TAGS.templateTasks], revalidate: 30 } },
    buildTemplateListQuery(filters, page),
  );

  const pagination = res.meta?.pagination;
  const resolvedPage = pagination?.page ?? Math.max(1, page);
  const pageCount = pagination?.pageCount ?? 1;

  return {
    templates: res.data.map(mapTemplateEntity),
    page: resolvedPage,
    pageCount,
    hasMore: resolvedPage < pageCount,
  };
}
