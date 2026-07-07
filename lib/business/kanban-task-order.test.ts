import { describe, expect, it } from "vitest";

import {
  applyKanbanTaskReorder,
  collectKanbanTaskUpdates,
  resolveKanbanDragEnd,
  tasksInStep,
  toKanbanColumnId,
  toKanbanTaskId,
  type KanbanTaskOrderItem,
} from "./kanban-task-order";

const steps = [{ id: 1 }, { id: 2 }];

const tasks: KanbanTaskOrderItem[] = [
  { id: 10, documentId: "t-10", stepId: 1, index: 0 },
  { id: 11, documentId: "t-11", stepId: 1, index: 1 },
  { id: 20, documentId: "t-20", stepId: 2, index: 2 },
];

describe("tasksInStep", () => {
  it("returns tasks sorted by index within a step", () => {
    expect(tasksInStep(tasks, 1).map((task) => task.id)).toEqual([10, 11]);
  });
});

describe("applyKanbanTaskReorder", () => {
  it("reorders tasks within the same step and reindexes globally", () => {
    const updated = applyKanbanTaskReorder(tasks, steps, 11, 10);
    expect(updated?.map((task) => task.id)).toEqual([11, 10, 20]);
    expect(updated?.map((task) => task.index)).toEqual([0, 1, 2]);
  });
});

describe("resolveKanbanDragEnd", () => {
  it("reorders when dropped on another task in the same column", () => {
    const result = resolveKanbanDragEnd(
      tasks,
      steps,
      toKanbanTaskId(11),
      toKanbanTaskId(10),
    );
    expect(result.type).toBe("updates");
    if (result.type === "updates") {
      expect(result.tasks.map((task) => task.id)).toEqual([11, 10, 20]);
    }
  });

  it("moves task to another column when dropped on its task", () => {
    const result = resolveKanbanDragEnd(
      tasks,
      steps,
      toKanbanTaskId(10),
      toKanbanTaskId(20),
    );
    expect(result.type).toBe("updates");
    if (result.type === "updates") {
      expect(result.tasks.find((task) => task.id === 10)?.stepId).toBe(2);
    }
  });

  it("moves task to column when dropped on column droppable", () => {
    const result = resolveKanbanDragEnd(
      tasks,
      steps,
      toKanbanTaskId(10),
      toKanbanColumnId(2),
    );
    expect(result.type).toBe("updates");
    if (result.type === "updates") {
      expect(result.tasks.map((task) => task.id)).toEqual([11, 20, 10]);
    }
  });
});

describe("collectKanbanTaskUpdates", () => {
  it("returns only tasks whose index or step changed", () => {
    const after = applyKanbanTaskReorder(tasks, steps, 11, 10)!;
    const updates = collectKanbanTaskUpdates(tasks, after);
    expect(updates).toEqual([
      { documentId: "t-11", index: 0, stepId: 1 },
      { documentId: "t-10", index: 1, stepId: 1 },
    ]);
  });
});
