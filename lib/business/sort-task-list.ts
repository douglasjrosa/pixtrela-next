import { TASK_STATUSES } from "@/lib/schemas/task";
import type {
  TaskListSort,
  TaskListSortColumn,
} from "@/lib/schemas/task-list-sort";

import type { SubTaskCompletionCount } from "./task-subtask-completion-count";

export type TaskListSortableRow = {
  id: string;
  name: string;
  qty: number;
  deliveryDate: string | null;
  status: string;
  totalTimeSpent: number;
};

const STATUS_ORDER = new Map<string, number>(
  TASK_STATUSES.map((status, index) => [status, index]),
);

function compareStrings(
  left: string,
  right: string,
  locale = "pt-BR",
): number {
  return left.localeCompare(right, locale, { sensitivity: "base" });
}

function compareNullableStrings(
  left: string | null | undefined,
  right: string | null | undefined,
): number {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return compareStrings(left, right);
}

function compareNumbers(left: number, right: number): number {
  return left - right;
}

function compareByColumn(
  left: TaskListSortableRow,
  right: TaskListSortableRow,
  column: TaskListSortColumn,
  completionByTaskId: ReadonlyMap<string, SubTaskCompletionCount>,
): number {
  switch (column) {
    case "name":
      return compareStrings(left.name, right.name);
    case "qty":
      return compareNumbers(left.qty, right.qty);
    case "deliveryDate":
      return compareNullableStrings(left.deliveryDate, right.deliveryDate);
    case "totalTimeSpent":
      return compareNumbers(left.totalTimeSpent, right.totalTimeSpent);
    case "finishedSubTasks": {
      const leftCounts = completionByTaskId.get(left.id) ?? {
        finishedCount: 0,
        totalCount: 0,
      };
      const rightCounts = completionByTaskId.get(right.id) ?? {
        finishedCount: 0,
        totalCount: 0,
      };
      const finishedDiff = compareNumbers(
        leftCounts.finishedCount,
        rightCounts.finishedCount,
      );
      if (finishedDiff !== 0) return finishedDiff;
      return compareNumbers(leftCounts.totalCount, rightCounts.totalCount);
    }
    case "status": {
      const leftOrder = STATUS_ORDER.get(left.status) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder =
        STATUS_ORDER.get(right.status) ?? Number.MAX_SAFE_INTEGER;
      return compareNumbers(leftOrder, rightOrder);
    }
    default:
      return 0;
  }
}

export function sortTaskListRows<T extends TaskListSortableRow>(
  rows: readonly T[],
  sort: TaskListSort,
  completionByTaskId: ReadonlyMap<string, SubTaskCompletionCount> = new Map(),
): T[] {
  const direction = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    const primary = compareByColumn(left, right, sort.column, completionByTaskId);
    if (primary !== 0) return primary * direction;
    const byName = compareStrings(left.name, right.name);
    if (byName !== 0) return byName;
    return compareStrings(left.id, right.id);
  });
}
