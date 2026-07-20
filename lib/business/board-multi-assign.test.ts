import { describe, expect, it } from "vitest";

import type { BoardSubTaskSummary } from "@/components/kanban/types";

import {
  applyMultiAssignToSubtask,
  applyMultiRemoveFromSubtask,
  buildMultiAssignUpdates,
  buildMultiRemoveUpdates,
  canApplyMultiAssign,
  countMultiSelection,
  isMultiSelectionDirty,
  toggleIdInSet,
  toggleTeamMembersInSelection,
} from "./board-multi-assign";

function subtaskStub(
  partial: Partial<BoardSubTaskSummary> &
    Pick<BoardSubTaskSummary, "documentId" | "name">,
): BoardSubTaskSummary {
  return {
    qty: 1,
    index: 0,
    expectedTime: 60,
    timeSpent: 0,
    sharingType: "duration",
    status: "waiting",
    activationStatus: "unlocked",
    assignedTo: [],
    openActivityStartedAts: [],
    sessions: [],
    ...partial,
  };
}

describe("toggleIdInSet", () => {
  it("adds a missing id and removes an existing one", () => {
    expect(toggleIdInSet(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleIdInSet(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("toggleTeamMembersInSelection", () => {
  it("adds all members when any are missing", () => {
    expect(toggleTeamMembersInSelection(["a"], ["b", "c"])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("removes all members when every member is selected", () => {
    expect(toggleTeamMembersInSelection(["a", "b", "c"], ["b", "c"])).toEqual([
      "a",
    ]);
  });
});

describe("canApplyMultiAssign", () => {
  it("requires at least one subtask and one collaborator", () => {
    expect(canApplyMultiAssign([], ["u1"])).toBe(false);
    expect(canApplyMultiAssign(["s1"], [])).toBe(false);
    expect(canApplyMultiAssign(["s1"], ["u1"])).toBe(true);
  });
});

describe("applyMultiAssignToSubtask / applyMultiRemoveFromSubtask", () => {
  it("assigns only missing collaborators", () => {
    expect(applyMultiAssignToSubtask(["u1"], ["u1", "u2"])).toEqual([
      "u1",
      "u2",
    ]);
  });

  it("removes only assigned collaborators from the selection", () => {
    expect(applyMultiRemoveFromSubtask(["u1", "u2"], ["u2", "u3"])).toEqual([
      "u1",
    ]);
  });
});

describe("buildMultiAssignUpdates / buildMultiRemoveUpdates", () => {
  const subtasks = [
    subtaskStub({
      documentId: "s1",
      name: "Corte",
      assignedTo: [{ documentId: "u1" }],
    }),
    subtaskStub({
      documentId: "s2",
      name: "Solda",
      assignedTo: [],
    }),
    subtaskStub({
      documentId: "s3",
      name: "Ignorada",
      assignedTo: [],
    }),
  ];

  it("builds assign updates only for selected subtasks that change", () => {
    const updates = buildMultiAssignUpdates(subtasks, ["s1", "s2"], ["u1", "u2"]);
    expect(updates).toEqual([
      { documentId: "s1", assignedToIds: ["u1", "u2"] },
      { documentId: "s2", assignedToIds: ["u1", "u2"] },
    ]);
  });

  it("omits assign updates when all selected collaborators were already assigned", () => {
    expect(buildMultiAssignUpdates(subtasks, ["s1"], ["u1"])).toEqual([]);
  });

  it("builds remove updates only for selected pairs that were assigned", () => {
    const updates = buildMultiRemoveUpdates(subtasks, ["s1", "s2"], ["u1"]);
    expect(updates).toEqual([{ documentId: "s1", assignedToIds: [] }]);
  });
});

describe("countMultiSelection / isMultiSelectionDirty", () => {
  it("counts selection sizes", () => {
    expect(countMultiSelection(["s1", "s2"], ["u1"])).toEqual({
      subtaskCount: 2,
      collaboratorCount: 1,
    });
  });

  it("is dirty only when multi is on and something is selected", () => {
    expect(isMultiSelectionDirty(false, ["s1"], [])).toBe(false);
    expect(isMultiSelectionDirty(true, [], [])).toBe(false);
    expect(isMultiSelectionDirty(true, ["s1"], [])).toBe(true);
    expect(isMultiSelectionDirty(true, [], ["u1"])).toBe(true);
  });
});
