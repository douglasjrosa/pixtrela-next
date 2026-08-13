import {
  computeGlobalTaskIndexUpdates,
  type StepTaskOrderItem,
  type StepTaskOrderStep,
} from "@/lib/business/step-task-order";
import type { Db } from "@/lib/db/client";
import { getDb } from "@/lib/db/client";
import { listSteps } from "@/lib/repos/steps";
import {
  applyTaskIndexUpdates,
  listActiveTasksForBoard,
} from "@/lib/repos/tasks";
import {
  isAutoStepTaskOrder,
  type StepTaskOrderBy,
} from "@/lib/schemas/step-task-order-by";

function toOrderItem(
  task: Awaited<ReturnType<typeof listActiveTasksForBoard>>[number],
): StepTaskOrderItem {
  return {
    id: task.id,
    stepId: task.stepId,
    index: task.index,
    deliveryDate: task.deliveryDate,
    createdAt: task.createdAt,
  };
}

function collectAutoStepIds(
  steps: StepTaskOrderStep[],
  stepIds?: string[],
): Set<string> {
  if (!stepIds) {
    return new Set(
      steps
        .filter((step) => isAutoStepTaskOrder(step.taskOrderBy))
        .map((step) => step.id),
    );
  }

  const allowed = new Set(stepIds);
  return new Set(
    steps
      .filter(
        (step) =>
          allowed.has(step.id) && isAutoStepTaskOrder(step.taskOrderBy),
      )
      .map((step) => step.id),
  );
}

export async function applyAutoStepTaskOrdering(
  options: { stepIds?: string[]; db?: Db } = {},
): Promise<void> {
  const db = options.db ?? getDb();
  const [stepRows, taskRows] = await Promise.all([
    listSteps(db),
    listActiveTasksForBoard(db),
  ]);

  const stepsToResort = collectAutoStepIds(stepRows, options.stepIds);
  if (stepsToResort.size === 0) return;

  const updates = computeGlobalTaskIndexUpdates(
    taskRows.map(toOrderItem),
    stepRows,
    stepsToResort,
  );
  await applyTaskIndexUpdates(updates, db);
}

export async function applyAutoStepTaskOrderingAfterTaskChange(input: {
  before?: { stepId: string | null; deliveryDate: string | null } | null;
  after: { stepId: string | null; deliveryDate: string | null };
  db?: Db;
}): Promise<void> {
  const db = input.db ?? getDb();
  const steps = await listSteps(db);
  const orderByByStepId = new Map(
    steps.map((step) => [step.id, step.taskOrderBy]),
  );

  const stepIds = new Set<string>();

  const maybeAddStep = (
    stepId: string | null,
    deliveryDate: string | null,
    previousDeliveryDate?: string | null,
  ): void => {
    if (!stepId) return;
    const orderBy = orderByByStepId.get(stepId);
    if (!orderBy || !isAutoStepTaskOrder(orderBy)) return;

    const usesDeliveryDate =
      orderBy === "delivery_date_asc" || orderBy === "delivery_date_desc";

    if (!usesDeliveryDate || previousDeliveryDate !== deliveryDate) {
      stepIds.add(stepId);
    }
  };

  maybeAddStep(
    input.after.stepId,
    input.after.deliveryDate,
    input.before?.stepId === input.after.stepId
      ? input.before.deliveryDate
      : undefined,
  );

  if (
    input.before?.stepId &&
    input.before.stepId !== input.after.stepId
  ) {
    maybeAddStep(input.before.stepId, input.before.deliveryDate);
  }

  if (stepIds.size === 0) return;
  await applyAutoStepTaskOrdering({ stepIds: [...stepIds], db });
}

export function shouldRecalculateStepOnOrderByChange(
  previous: StepTaskOrderBy,
  next: StepTaskOrderBy,
): boolean {
  return previous !== next && isAutoStepTaskOrder(next);
}
