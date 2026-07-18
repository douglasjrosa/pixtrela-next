import {
  TEMPLATE_LIST_PAGE_SIZE,
  type TemplateListFilters,
} from "@/lib/schemas/template-list-filters";
import type { StrapiQueryParams } from "@/lib/strapi/query";

export const TEMPLATE_LIST_FIELDS = ["documentId", "name", "code"] as const;

/**
 * Builds lean Strapi query for the filtered/paginated template-tasks list.
 */
export function buildTemplateListQuery(
  filters: TemplateListFilters,
  page: number,
): StrapiQueryParams {
  const queryFilters: Record<string, unknown> = {};

  if (filters.q) {
    queryFilters.name = { $containsi: filters.q };
  }
  if (filters.code) {
    queryFilters.code = { $containsi: filters.code };
  }

  return {
    fields: [...TEMPLATE_LIST_FIELDS],
    populate: { subTask: { fields: ["name"] } },
    ...(Object.keys(queryFilters).length > 0
      ? { filters: queryFilters }
      : {}),
    sort: "name:asc",
    pagination: {
      page: Math.max(1, page),
      pageSize: TEMPLATE_LIST_PAGE_SIZE,
    },
  };
}
