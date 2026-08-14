import type { StepTaskOrderBy } from "@/lib/schemas/step-task-order-by";
import { isAutoStepTaskOrder } from "@/lib/schemas/step-task-order-by";

export interface StepTaskOrderItem {
  id: string;
  stepId: string | null;
  index: number;
  deliveryDate: string | null;
  createdAt: Date;
}

export interface StepTaskOrderStep {
  id: string;
  index: number;
  taskOrderBy: StepTaskOrderBy;
}

function compareNullableDates(
  left: string | null,
  right: string | null,
): number {
  if (left === right) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left.localeCompare(right);
}

function compareCreatedAt(
  left: StepTaskOrderItem,
  right: StepTaskOrderItem,
): number {
  const byTime = left.createdAt.getTime() - right.createdAt.getTime();
  if (byTime !== 0) return byTime;
  return left.id.localeCompare(right.id);
}

export function compareTasksForStepOrder(
  left: StepTaskOrderItem,
  right: StepTaskOrderItem,
  orderBy: StepTaskOrderBy,
): number {
  switch (orderBy) {
    case "manual":
      return left.index - right.index;
    case "delivery_date_asc": {
      const byDate = compareNullableDates(left.deliveryDate, right.deliveryDate);
      if (byDate !== 0) return byDate;
      return compareCreatedAt(left, right);
    }
    case "delivery_date_desc": {
      const byDate = compareNullableDates(right.deliveryDate, left.deliveryDate);
      if (byDate !== 0) return byDate;
      return compareCreatedAt(left, right);
    }
    case "created_at_asc":
      return compareCreatedAt(left, right);
    case "created_at_desc": {
      const byTime = right.createdAt.getTime() - left.createdAt.getTime();
      if (byTime !== 0) return byTime;
      return left.id.localeCompare(right.id);
    }
    default:
      return left.index - right.index;
  }
}

export function sortTasksInStep(
  tasks: StepTaskOrderItem[],
  orderBy: StepTaskOrderBy,
): StepTaskOrderItem[] {
  return [...tasks].sort((left, right) =>
    compareTasksForStepOrder(left, right, orderBy),
  );
}

export function computeGlobalTaskIndexUpdates(
  allTasks: StepTaskOrderItem[],
  steps: StepTaskOrderStep[],
  stepsToResort: ReadonlySet<string>,
): Array<{ id: string; index: number }> {
  const stepsSorted = [...steps].sort((left, right) => left.index - right.index);
  const tasksByStepId = new Map<string, StepTaskOrderItem[]>();

  for (const task of allTasks) {
    if (!task.stepId) continue;
    const bucket = tasksByStepId.get(task.stepId) ?? [];
    bucket.push(task);
    tasksByStepId.set(task.stepId, bucket);
  }

  let globalIndex = 0;
  const nextIndexByTaskId = new Map<string, number>();

  for (const step of stepsSorted) {
    const stepTasks = tasksByStepId.get(step.id) ?? [];
    const ordered =
      stepsToResort.has(step.id) && isAutoStepTaskOrder(step.taskOrderBy)
        ? sortTasksInStep(stepTasks, step.taskOrderBy)
        : [...stepTasks].sort((left, right) => left.index - right.index);

    for (const task of ordered) {
      nextIndexByTaskId.set(task.id, globalIndex);
      globalIndex += 1;
    }
  }

  const orphans = allTasks
    .filter((task) => task.stepId == null)
    .sort((left, right) => left.index - right.index);

  for (const task of orphans) {
    nextIndexByTaskId.set(task.id, globalIndex);
    globalIndex += 1;
  }

  const updates: Array<{ id: string; index: number }> = [];
  for (const task of allTasks) {
    const nextIndex = nextIndexByTaskId.get(task.id);
    if (nextIndex == null || nextIndex === task.index) continue;
    updates.push({ id: task.id, index: nextIndex });
  }

  return updates;
}
