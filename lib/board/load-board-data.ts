import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import {
  buildStepKanbanLookup,
  mapStepsToKanbanSteps,
  stableKanbanTaskNumericId,
} from "@/lib/board/kanban-drizzle-ids";
import { listSteps as listStepsRepo } from "@/lib/repos/steps";
import { listActiveTasksForBoard } from "@/lib/repos/tasks";

export async function loadDrizzleBoardData(): Promise<{
  steps: KanbanStep[];
  tasks: KanbanTask[];
  stepLookup: ReturnType<typeof buildStepKanbanLookup>;
}> {
  const [stepRows, taskRows] = await Promise.all([
    listStepsRepo(),
    listActiveTasksForBoard(),
  ]);
  const stepLookup = buildStepKanbanLookup(stepRows);

  const steps: KanbanStep[] = mapStepsToKanbanSteps(stepRows);

  const tasks: KanbanTask[] = taskRows.map((task) => ({
    id: stableKanbanTaskNumericId(task.id),
    documentId: task.id,
    name: task.name,
    qty: task.qty,
    status: task.status,
    stepId: task.stepId
      ? (stepLookup.kanbanIdByStepUuid.get(task.stepId) ?? null)
      : null,
    index: task.index,
    deliveryDate: task.deliveryDate,
    endedAt: task.endedAt?.toISOString() ?? null,
    totalExpectedTime: task.totalExpectedTime,
    totalTimeSpent: task.totalTimeSpent,
  }));

  return { steps, tasks, stepLookup };
}

export async function resolveDrizzleTaskIdByKanbanNumericId(
  kanbanTaskId: number,
): Promise<string | null> {
  const taskRows = await listActiveTasksForBoard();
  for (const task of taskRows) {
    if (stableKanbanTaskNumericId(task.id) === kanbanTaskId) {
      return task.id;
    }
  }
  return null;
}
