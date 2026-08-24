import { cache } from "react";
import { eq } from "drizzle-orm";

import type { TaskRow } from "@/components/tasks/types";
import { groupSubTaskCompletionCountsByTaskId } from "@/lib/business/task-subtask-completion-count";
import { sortTaskListRows } from "@/lib/business/sort-task-list";
import { getDb } from "@/lib/db/client";
import {
  listSubTaskCompletionSnapshotsForTasks,
  listTasks,
} from "@/lib/repos/tasks";
import {
  TASK_LIST_PAGE_SIZE,
  type TaskListFilters,
} from "@/lib/schemas/task-list-filters";
import { taskListFilterKey } from "@/lib/tasks/task-list-params";
import { steps } from "@/drizzle/schema";

export type TaskListPageResult = {
  tasks: TaskRow[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

const loadTaskListPageCached = cache(
  async (
    _filterKey: string,
    page: number,
    filters: TaskListFilters,
  ): Promise<TaskListPageResult> => {
    const rows = await listTasks();
    const q = filters.q?.toLowerCase();
    const filtered = rows.filter((task) => {
      if (task.active === filters.showArchived) return false;
      if (!filters.statuses.includes(task.status)) return false;
      if (task.deliveryDate && task.deliveryDate < filters.from) return false;
      if (filters.to && task.deliveryDate && task.deliveryDate > filters.to) {
        return false;
      }
      if (q && !task.name.toLowerCase().includes(q)) return false;
      return true;
    });

    const completionByTaskId = groupSubTaskCompletionCountsByTaskId(
      await listSubTaskCompletionSnapshotsForTasks(
        filtered.map((task) => task.id),
      ),
    );
    const sorted = sortTaskListRows(
      filtered,
      { column: filters.column, direction: filters.direction },
      completionByTaskId,
    );

    const resolvedPage = Math.max(1, page);
    const pageCount = Math.max(
      1,
      Math.ceil(sorted.length / TASK_LIST_PAGE_SIZE),
    );
    const start = (resolvedPage - 1) * TASK_LIST_PAGE_SIZE;
    const slice = sorted.slice(start, start + TASK_LIST_PAGE_SIZE);

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
      const completion = completionByTaskId.get(task.id) ?? {
        finishedCount: 0,
        totalCount: 0,
      };
      tasks.push({
        documentId: task.id,
        name: task.name,
        qty: task.qty,
        deliveryDate: task.deliveryDate,
        index: task.index,
        status: task.status,
        active: task.active,
        reasonForDeactivation: task.reasonForDeactivation,
        templateTaskCode: task.templateTaskCode,
        totalExpectedTime: task.totalExpectedTime,
        totalTimeSpent: task.totalTimeSpent,
        finishedSubTaskCount: completion.finishedCount,
        totalSubTaskCount: completion.totalCount,
        step,
      });
    }

    return {
      tasks,
      page: resolvedPage,
      pageCount,
      hasMore: resolvedPage < pageCount,
    };
  },
);

/**
 * Loads one page of filtered tasks from Drizzle repos.
 * Deduped per request via React.cache keyed by filterKey + page.
 */
export async function loadTaskListPage(
  filters: TaskListFilters,
  page: number,
): Promise<TaskListPageResult> {
  return loadTaskListPageCached(taskListFilterKey(filters), page, filters);
}
