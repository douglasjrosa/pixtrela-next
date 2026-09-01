import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import {
  boardColumnCursorFromTask,
  type BoardColumnPageCursor,
} from "@/lib/board/column-task-page";
import {
  buildStepKanbanLookup,
  mapStepsToKanbanSteps,
  stableKanbanTaskNumericId,
} from "@/lib/board/kanban-drizzle-ids";
import { STEP_TASKS_PER_LOAD_DEFAULT } from "@/lib/schemas/step";
import { listSteps as listStepsRepo } from "@/lib/repos/steps";
import {
  countActiveTasksByStepId,
  listActiveTasksForBoard,
  listActiveTasksForBoardColumn,
} from "@/lib/repos/tasks";

export type BoardColumnPage = {
  stepDocumentId: string;
  totalCount: number;
  tasks: KanbanTask[];
  cursor: BoardColumnPageCursor | null;
};

function mapTaskRowToKanban(
  task: Awaited<ReturnType<typeof listActiveTasksForBoardColumn>>[number],
  stepLookup: ReturnType<typeof buildStepKanbanLookup>,
): KanbanTask {
  return {
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
  };
}

export async function loadDrizzleBoardData(): Promise<{
  steps: KanbanStep[];
  columns: BoardColumnPage[];
  tasks: KanbanTask[];
  stepLookup: ReturnType<typeof buildStepKanbanLookup>;
}> {
  const stepRows = await listStepsRepo();
  const stepLookup = buildStepKanbanLookup(stepRows);
  const steps: KanbanStep[] = mapStepsToKanbanSteps(stepRows);

  const columns = await Promise.all(
    stepRows.map(async (step) => {
      const limit = step.tasksPerLoad ?? STEP_TASKS_PER_LOAD_DEFAULT;
      const [totalCount, taskRows] = await Promise.all([
        countActiveTasksByStepId(step.id),
        listActiveTasksForBoardColumn(step.id, step.taskOrderBy, { limit }),
      ]);
      const tasks = taskRows.map((task) => mapTaskRowToKanban(task, stepLookup));
      const last = taskRows[taskRows.length - 1];
      return {
        stepDocumentId: step.id,
        totalCount,
        tasks,
        cursor: last ? boardColumnCursorFromTask(last) : null,
      } satisfies BoardColumnPage;
    }),
  );

  const tasks = columns.flatMap((column) => column.tasks);
  return { steps, columns, tasks, stepLookup };
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
