import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import type { TaskFormInput } from "@/lib/schemas/task";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import type { TaskRow } from "@/components/tasks/types";

import { buildTaskListQuery } from "./build-task-list-query";

interface TaskEntity {
  documentId: string;
  name: string;
  qty: number;
  deliveryDate?: string | null;
  index: number;
  status: TaskFormInput["status"];
  active?: boolean;
  templateTaskCode?: string | null;
  totalExpectedTime?: number;
  totalTimeSpent?: number;
  step?: { documentId: string; name: string } | null;
}

interface StrapiListResponse {
  data: TaskEntity[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export type TaskListPageResult = {
  tasks: TaskRow[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

function mapTaskEntity(task: TaskEntity): TaskRow {
  return {
    documentId: task.documentId,
    name: task.name,
    qty: task.qty,
    deliveryDate: task.deliveryDate,
    index: task.index,
    status: task.status,
    active: task.active ?? true,
    templateTaskCode: task.templateTaskCode,
    totalExpectedTime: task.totalExpectedTime ?? 0,
    totalTimeSpent: task.totalTimeSpent ?? 0,
    step: task.step ?? null,
  };
}

/**
 * Loads one page of filtered tasks via Strapi REST + Next fetch cache tags.
 */
export async function loadTaskListPage(
  filters: TaskListFilters,
  page: number,
): Promise<TaskListPageResult> {
  const res = await strapiFetch<StrapiListResponse>(
    "/tasks",
    { strapiCache: { tags: [STRAPI_TAGS.tasks], revalidate: 30 } },
    buildTaskListQuery(filters, page),
  );

  const pagination = res.meta?.pagination;
  const resolvedPage = pagination?.page ?? Math.max(1, page);
  const pageCount = pagination?.pageCount ?? 1;

  return {
    tasks: res.data.map(mapTaskEntity),
    page: resolvedPage,
    pageCount,
    hasMore: resolvedPage < pageCount,
  };
}
