/** Kanban UI uses numeric ids (Strapi legacy); Drizzle uses UUIDs and step.index. */

const KANBAN_UUID_HEX_SLICE_LENGTH = 8;
const KANBAN_ID_RADIX = 16;

export function stableKanbanTaskNumericId(taskUuid: string): number {
  const hex = taskUuid.replace(/-/g, "").slice(0, KANBAN_UUID_HEX_SLICE_LENGTH);
  const parsed = Number.parseInt(hex, KANBAN_ID_RADIX);
  return Number.isFinite(parsed) ? parsed : 0;
}

export type StepKanbanLookup = {
  kanbanIdByStepUuid: Map<string, number>;
  stepUuidByKanbanId: Map<number, string>;
};

export function buildStepKanbanLookup(
  steps: ReadonlyArray<{ id: string; index: number }>,
): StepKanbanLookup {
  const kanbanIdByStepUuid = new Map<string, number>();
  const stepUuidByKanbanId = new Map<number, string>();
  for (const step of steps) {
    kanbanIdByStepUuid.set(step.id, step.index);
    stepUuidByKanbanId.set(step.index, step.id);
  }
  return { kanbanIdByStepUuid, stepUuidByKanbanId };
}

export function resolveStepUuidFromKanbanId(
  lookup: StepKanbanLookup,
  kanbanStepId: number,
): string | null {
  return lookup.stepUuidByKanbanId.get(kanbanStepId) ?? null;
}
