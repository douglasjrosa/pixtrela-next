export const KANBAN_COLUMN_PREFIX = "column:";
export const KANBAN_TASK_PREFIX = "task:";

export interface KanbanTaskOrderItem {
  id: number;
  documentId: string;
  stepId: number | null;
  index: number;
}

export function toKanbanColumnId(stepId: number): string {
  return `${KANBAN_COLUMN_PREFIX}${stepId}`;
}

export function toKanbanTaskId(taskId: number): string {
  return `${KANBAN_TASK_PREFIX}${taskId}`;
}

export function parseKanbanColumnId(id: unknown): number | null {
  if (typeof id !== "string" || !id.startsWith(KANBAN_COLUMN_PREFIX)) return null;
  const parsed = Number(id.slice(KANBAN_COLUMN_PREFIX.length));
  return Number.isInteger(parsed) ? parsed : null;
}

export function parseKanbanTaskId(id: unknown): number | null {
  if (typeof id !== "string" || !id.startsWith(KANBAN_TASK_PREFIX)) return null;
  const parsed = Number(id.slice(KANBAN_TASK_PREFIX.length));
  return Number.isInteger(parsed) ? parsed : null;
}

export function tasksInStep(
  tasks: KanbanTaskOrderItem[],
  stepId: number,
): KanbanTaskOrderItem[] {
  return tasks
    .filter((task) => task.stepId === stepId)
    .sort((left, right) => left.index - right.index);
}

export function moveTaskInOrderById<T extends { id: number }>(
  items: T[],
  activeId: number,
  overId: number,
): T[] | null {
  if (activeId === overId) return null;

  const fromIndex = items.findIndex((item) => item.id === activeId);
  const toIndex = items.findIndex((item) => item.id === overId);
  if (fromIndex === -1 || toIndex === -1) return null;

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function mergeStepTasksIntoBoard(
  tasks: KanbanTaskOrderItem[],
  steps: { id: number }[],
  stepId: number,
  stepTasksOrdered: KanbanTaskOrderItem[],
): KanbanTaskOrderItem[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  for (const task of stepTasksOrdered) {
    byId.set(task.id, task);
  }

  let index = 0;
  const result: KanbanTaskOrderItem[] = [];

  for (const step of steps) {
    const inStep =
      step.id === stepId
        ? stepTasksOrdered
        : tasksInStep([...byId.values()], step.id);
    for (const task of inStep) {
      const current = byId.get(task.id);
      if (!current) continue;
      result.push({ ...current, index });
      index += 1;
    }
  }

  const orphans = tasks.filter((task) => task.stepId == null);
  for (const task of orphans) {
    result.push({ ...task, index });
    index += 1;
  }

  return result;
}

export function applyKanbanTaskReorder(
  tasks: KanbanTaskOrderItem[],
  steps: { id: number }[],
  activeTaskId: number,
  overTaskId: number,
): KanbanTaskOrderItem[] | null {
  const active = tasks.find((task) => task.id === activeTaskId);
  const over = tasks.find((task) => task.id === overTaskId);
  if (!active || !over || active.stepId !== over.stepId || active.stepId == null) {
    return null;
  }

  const stepTasks = tasksInStep(tasks, active.stepId);
  const reordered = moveTaskInOrderById(stepTasks, activeTaskId, overTaskId);
  if (!reordered) return null;

  return mergeStepTasksIntoBoard(tasks, steps, active.stepId, reordered);
}

export function moveTaskToStepInOrder(
  tasks: KanbanTaskOrderItem[],
  steps: { id: number }[],
  activeTaskId: number,
  targetStepId: number,
  overTaskId: number | null,
): KanbanTaskOrderItem[] {
  const active = tasks.find((task) => task.id === activeTaskId);
  if (!active) return tasks;

  const sourceStepId = active.stepId;
  const withoutActive = tasks.filter((task) => task.id !== activeTaskId);
  const moved: KanbanTaskOrderItem = { ...active, stepId: targetStepId };

  let targetStepTasks = tasksInStep(withoutActive, targetStepId);
  if (overTaskId != null) {
    const overIndex = targetStepTasks.findIndex((task) => task.id === overTaskId);
    targetStepTasks = [...targetStepTasks];
    if (overIndex >= 0) {
      targetStepTasks.splice(overIndex, 0, moved);
    } else {
      targetStepTasks.push(moved);
    }
  } else {
    targetStepTasks = [...targetStepTasks, moved];
  }

  let next = mergeStepTasksIntoBoard(withoutActive, steps, targetStepId, targetStepTasks);

  if (sourceStepId != null && sourceStepId !== targetStepId) {
    const sourceTasks = tasksInStep(
      next.filter((task) => task.id !== activeTaskId || task.stepId === sourceStepId),
      sourceStepId,
    );
    next = mergeStepTasksIntoBoard(next, steps, sourceStepId, sourceTasks);
  }

  return next;
}

export type KanbanDragResult =
  | { type: "noop" }
  | { type: "updates"; tasks: KanbanTaskOrderItem[] };

/** Pure drag-end resolver for KanbanBoard tests and UI. */
export function resolveKanbanDragEnd(
  tasks: KanbanTaskOrderItem[],
  steps: { id: number }[],
  activeRaw: unknown,
  overRaw: unknown,
): KanbanDragResult {
  const activeTaskId = parseKanbanTaskId(activeRaw);
  if (activeTaskId == null) return { type: "noop" };

  const overTaskId = parseKanbanTaskId(overRaw);
  if (overTaskId != null) {
    const active = tasks.find((task) => task.id === activeTaskId);
    const over = tasks.find((task) => task.id === overTaskId);
    if (!active || !over) return { type: "noop" };

    if (active.stepId === over.stepId && active.stepId != null) {
      const updated = applyKanbanTaskReorder(tasks, steps, activeTaskId, overTaskId);
      return updated ? { type: "updates", tasks: updated } : { type: "noop" };
    }

    if (over.stepId != null) {
      return {
        type: "updates",
        tasks: moveTaskToStepInOrder(tasks, steps, activeTaskId, over.stepId, overTaskId),
      };
    }
  }

  const overStepId = parseKanbanColumnId(overRaw);
  if (overStepId != null) {
    return {
      type: "updates",
      tasks: moveTaskToStepInOrder(tasks, steps, activeTaskId, overStepId, null),
    };
  }

  return { type: "noop" };
}

export function collectKanbanTaskUpdates(
  before: KanbanTaskOrderItem[],
  after: KanbanTaskOrderItem[],
): { documentId: string; index: number; stepId: number | null }[] {
  const beforeById = new Map(before.map((task) => [task.id, task]));
  const updates: { documentId: string; index: number; stepId: number | null }[] = [];

  for (const task of after) {
    const previous = beforeById.get(task.id);
    if (!previous) continue;
    if (previous.index === task.index && previous.stepId === task.stepId) continue;
    updates.push({
      documentId: task.documentId,
      index: task.index,
      stepId: task.stepId,
    });
  }

  return updates;
}
