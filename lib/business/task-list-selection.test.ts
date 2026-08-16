import { describe, expect, it } from "vitest";

import type { TaskRow } from "@/components/tasks/types";

import {
  areAllSelectedTasksArchived,
  areAllTasksSelected,
  selectedTasksFromList,
  toggleIdInSet,
  toggleSelectAllTasks,
} from "./task-list-selection";

function taskStub(
  overrides: Partial<TaskRow> & Pick<TaskRow, "documentId">,
): TaskRow {
  return {
    documentId: overrides.documentId,
    name: overrides.name ?? overrides.documentId,
    qty: 1,
    index: 0,
    status: "waiting",
    active: overrides.active ?? true,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
    ...overrides,
  };
}

describe("task-list-selection", () => {
  it("toggles ids in a set", () => {
    expect(toggleIdInSet(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleIdInSet(["a", "b"], "a")).toEqual(["b"]);
  });

  it("selects and clears all visible tasks", () => {
    const tasks = [
      taskStub({ documentId: "t1" }),
      taskStub({ documentId: "t2" }),
    ];
    expect(areAllTasksSelected(tasks, [])).toBe(false);
    const all = toggleSelectAllTasks(tasks, []);
    expect(all).toEqual(["t1", "t2"]);
    expect(areAllTasksSelected(tasks, all)).toBe(true);
    expect(toggleSelectAllTasks(tasks, all)).toEqual([]);
  });

  it("detects when all selected tasks are archived", () => {
    const tasks = [
      taskStub({ documentId: "t1", active: false }),
      taskStub({ documentId: "t2", active: false }),
    ];
    const selected = selectedTasksFromList(tasks, ["t1", "t2"]);
    expect(areAllSelectedTasksArchived(selected)).toBe(true);
    expect(
      areAllSelectedTasksArchived(
        selectedTasksFromList(tasks, ["t1"]),
      ),
    ).toBe(true);
    expect(
      areAllSelectedTasksArchived(
        selectedTasksFromList(
          [taskStub({ documentId: "t3", active: true }), ...tasks],
          ["t1", "t3"],
        ),
      ),
    ).toBe(false);
  });
});
