import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import { TASK_LIST_PAGE_SIZE } from "@/lib/schemas/task-list-filters";
import type { StrapiQueryParams } from "@/lib/strapi/query";

export const TASK_LIST_FIELDS = [
  "documentId",
  "name",
  "qty",
  "deliveryDate",
  "index",
  "status",
  "active",
  "templateTaskCode",
  "totalExpectedTime",
  "totalTimeSpent",
] as const;

/**
 * Builds lean Strapi query for the filtered/paginated tasks list.
 */
export function buildTaskListQuery(
  filters: TaskListFilters,
  page: number,
): StrapiQueryParams {
  const deliveryDate: Record<string, string> = { $gte: filters.from };
  if (filters.to) {
    deliveryDate.$lte = filters.to;
  }

  const queryFilters: Record<string, unknown> = {
    status: { $in: filters.statuses },
    deliveryDate,
  };

  if (filters.q) {
    queryFilters.name = { $containsi: filters.q };
  }

  return {
    fields: [...TASK_LIST_FIELDS],
    populate: { step: { fields: ["documentId", "name"] } },
    filters: queryFilters,
    sort: "deliveryDate:asc",
    pagination: {
      page: Math.max(1, page),
      pageSize: TASK_LIST_PAGE_SIZE,
    },
  };
}
