import { describe, expect, it } from "vitest";

import { boardSubTaskSummaryStub } from "@/lib/business/board-subtask-summary";

import {
  isSubtaskAssignedTo,
  splitSubtasksByFinished,
  subtasksAssignedToCollaborator,
  toggleCollaboratorOnSubtask,
  toggleTeamOnSubtask,
} from "./board-assign-focus";

describe("splitSubtasksByFinished", () => {
  it("splits pending and finished subtasks", () => {
    const pending = boardSubTaskSummaryStub({
      documentId: "st-1",
      status: "waiting",
    });
    const producing = boardSubTaskSummaryStub({
      documentId: "st-2",
      status: "producing",
    });
    const finished = boardSubTaskSummaryStub({
      documentId: "st-3",
      status: "finished",
    });

    expect(splitSubtasksByFinished([pending, producing, finished])).toEqual({
      pending: [pending, producing],
      finished: [finished],
    });
  });
});

describe("toggleCollaboratorOnSubtask", () => {
  it("adds and removes a collaborator id", () => {
    expect(toggleCollaboratorOnSubtask([], "u-1")).toEqual(["u-1"]);
    expect(toggleCollaboratorOnSubtask(["u-1", "u-2"], "u-1")).toEqual(["u-2"]);
  });
});

describe("toggleTeamOnSubtask", () => {
  it("selects all team members when none or partial are selected", () => {
    expect(toggleTeamOnSubtask(["u-1"], ["u-1", "u-2"])).toEqual(["u-1", "u-2"]);
  });

  it("clears team members when all are selected", () => {
    expect(toggleTeamOnSubtask(["u-1", "u-2", "u-3"], ["u-1", "u-2"])).toEqual([
      "u-3",
    ]);
  });

  it("returns value unchanged when team has no members", () => {
    expect(toggleTeamOnSubtask(["u-1"], [])).toEqual(["u-1"]);
  });
});

describe("isSubtaskAssignedTo / subtasksAssignedToCollaborator", () => {
  const assigned = boardSubTaskSummaryStub({
    documentId: "st-1",
    assignedTo: [{ documentId: "u-1", name: "Ana" }],
  });
  const other = boardSubTaskSummaryStub({
    documentId: "st-2",
    assignedTo: [{ documentId: "u-2", name: "Bob" }],
  });

  it("detects assignment", () => {
    expect(isSubtaskAssignedTo(assigned, "u-1")).toBe(true);
    expect(isSubtaskAssignedTo(other, "u-1")).toBe(false);
  });

  it("lists subtasks assigned to a collaborator", () => {
    expect(subtasksAssignedToCollaborator([assigned, other], "u-1")).toEqual([
      assigned,
    ]);
  });
});
