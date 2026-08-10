import { eq } from "drizzle-orm";

import type { TaskRow } from "@/components/tasks/types";
import { isDrizzleBackend } from "@/lib/db/backend";
import { getDb } from "@/lib/db/client";
import { listTasks } from "@/lib/repos/tasks";
import type { TaskFormInput } from "@/lib/schemas/task";
import {
  TASK_LIST_PAGE_SIZE,
  type TaskListFilters,
} from "@/lib/schemas/task-list-filters";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { steps } from "@/drizzle/schema";

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

async function loadDrizzleTaskListPage(
  filters: TaskListFilters,
  page: number,
): Promise<TaskListPageResult> {
  const rows = await listTasks();
  const q = filters.q?.toLowerCase();
  const filtered = rows.filter((task) => {
    if (!task.active) return false;
    if (!filters.statuses.includes(task.status)) return false;
    if (task.deliveryDate && task.deliveryDate < filters.from) return false;
    if (filters.to && task.deliveryDate && task.deliveryDate > filters.to) {
      return false;
    }
    if (q && !task.name.toLowerCase().includes(q)) return false;
    return true;
  });

  const resolvedPage = Math.max(1, page);
  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / TASK_LIST_PAGE_SIZE),
  );
  const start = (resolvedPage - 1) * TASK_LIST_PAGE_SIZE;
  const slice = filtered.slice(start, start + TASK_LIST_PAGE_SIZE);

  const db = getDb();
  const tasks: TaskRow[] = [];
  for (const task of slice) {
    let step: TaskRow["step"] = null;
    if (task.stepId) {
      const [stepRow] = await db
        .select({ id: steps.id, name: steps.name })
        .from(steps)
        .where(eq(steps.id, task.stepId))
        .limit(1);
      if (stepRow) {
        step = { documentId: stepRow.id, name: stepRow.name };
      }
    }
    tasks.push({
      documentId: task.id,
      name: task.name,
      qty: task.qty,
      deliveryDate: task.deliveryDate,
      index: task.index,
      status: task.status,
      active: task.active,
      templateTaskCode: task.templateTaskCode,
      totalExpectedTime: task.totalExpectedTime,
      totalTimeSpent: task.totalTimeSpent,
      step,
    });
  }

  return {
    tasks,
    page: resolvedPage,
    pageCount,
    hasMore: resolvedPage < pageCount,
  };
}

/**
 * Loads one page of filtered tasks (Drizzle or Strapi REST).
 */
export async function loadTaskListPage(
  filters: TaskListFilters,
  page: number,
): Promise<TaskListPageResult> {
  if (isDrizzleBackend()) {
    return loadDrizzleTaskListPage(filters, page);
  }

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
