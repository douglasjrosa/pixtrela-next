import type { TemplateListRow } from "@/components/templates/types";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";
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

/**
 * Loads one page of filtered template-tasks via Strapi REST + cache tags.
 */
export async function loadTemplateListPage(
  filters: TemplateListFilters,
  page: number,
): Promise<TemplateListPageResult> {
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
