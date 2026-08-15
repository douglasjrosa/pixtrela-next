/** Kanban UI uses numeric ids (Strapi legacy); Drizzle uses UUIDs. */

import type { KanbanStep } from "@/components/kanban/types";
import type { StepTaskOrderBy } from "@/lib/schemas/step-task-order-by";

const KANBAN_UUID_HEX_SLICE_LENGTH = 8;
const KANBAN_ID_RADIX = 16;

export type StepRowForKanban = {
  id: string;
  name: string;
  index: number;
  taskOrderBy: StepTaskOrderBy;
};

export function stableKanbanTaskNumericId(taskUuid: string): number {
  const hex = taskUuid.replace(/-/g, "").slice(0, KANBAN_UUID_HEX_SLICE_LENGTH);
  const parsed = Number.parseInt(hex, KANBAN_ID_RADIX);
  return Number.isFinite(parsed) ? parsed : 0;
}

export type StepKanbanLookup = {
  kanbanIdByStepUuid: Map<string, number>;
  stepUuidByKanbanId: Map<number, string>;
};

/** Stable column order when DB step.index values collide. */
export function sortStepsForKanban<T extends { id: string; index: number }>(
  steps: ReadonlyArray<T>,
): T[] {
  return [...steps].sort((left, right) => {
    if (left.index !== right.index) return left.index - right.index;
    return left.id.localeCompare(right.id);
  });
}

export function buildStepKanbanLookup(
  steps: ReadonlyArray<{ id: string; index: number }>,
): StepKanbanLookup {
  const kanbanIdByStepUuid = new Map<string, number>();
  const stepUuidByKanbanId = new Map<number, string>();
  for (const [kanbanId, step] of sortStepsForKanban(steps).entries()) {
    kanbanIdByStepUuid.set(step.id, kanbanId);
    stepUuidByKanbanId.set(kanbanId, step.id);
  }
  return { kanbanIdByStepUuid, stepUuidByKanbanId };
}

export function mapStepsToKanbanSteps(
  stepRows: ReadonlyArray<StepRowForKanban>,
): KanbanStep[] {
  return sortStepsForKanban(stepRows).map((step, kanbanId) => ({
    id: kanbanId,
    documentId: step.id,
    name: step.name,
    taskOrderBy: step.taskOrderBy,
  }));
}

export function resolveStepUuidFromKanbanId(
  lookup: StepKanbanLookup,
  kanbanStepId: number,
): string | null {
  return lookup.stepUuidByKanbanId.get(kanbanStepId) ?? null;
}
