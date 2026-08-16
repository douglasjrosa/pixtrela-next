import { describe, expect, it } from "vitest";

import {
  countFinishedSubTasksForTask,
  groupSubTaskCompletionCountsByTaskId,
} from "./task-subtask-completion-count";

describe("task-subtask-completion-count", () => {
  it("counts finished sub-tasks among non-disabled rows", () => {
    expect(
      countFinishedSubTasksForTask([
        { status: "finished", activationStatus: "active" },
        { status: "waiting", activationStatus: "inactive" },
        { status: "finished", activationStatus: "blocked" },
      ]),
    ).toEqual({ finishedCount: 1, totalCount: 2 });
  });

  it("groups counts by task id", () => {
    const grouped = groupSubTaskCompletionCountsByTaskId([
      {
        taskId: "t1",
        status: "finished",
        activationStatus: "active",
      },
      {
        taskId: "t1",
        status: "waiting",
        activationStatus: "inactive",
      },
      {
        taskId: "t2",
        status: "finished",
        activationStatus: "inactive",
      },
    ]);

    expect(grouped.get("t1")).toEqual({ finishedCount: 1, totalCount: 2 });
    expect(grouped.get("t2")).toEqual({ finishedCount: 1, totalCount: 1 });
  });
});
