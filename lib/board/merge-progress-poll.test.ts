import { describe, expect, it } from "vitest";

import type { KanbanTask } from "@/components/kanban/types";
import { mergeBoardProgressPoll } from "./merge-progress-poll";

function taskStub(
  partial: Partial<KanbanTask> & Pick<KanbanTask, "documentId">,
): KanbanTask {
  return {
    id: 1,
    name: "Task",
    qty: 1,
    status: "producing",
    stepId: 1,
    index: 0,
    totalExpectedTime: 100,
    totalTimeSpent: 10,
    ...partial,
  };
}

describe("mergeBoardProgressPoll", () => {
  it("updates live tasks from snapshot and leaves finished untouched", () => {
    const tasks = [
      taskStub({ documentId: "live", status: "producing", totalTimeSpent: 10 }),
      taskStub({
        documentId: "done",
        status: "finished",
        totalTimeSpent: 90,
        totalExpectedTime: 100,
      }),
    ];

    const merged = mergeBoardProgressPoll(tasks, {
      nowMs: 1_700_000_000_000,
      progressByTaskId: {
        live: {
          subTasks: [{ status: "producing", expectedTime: 100, timeSpent: 20 }],
          openActivityStartedAts: ["2026-07-16T12:00:00.000Z"],
        },
      },
      badgesByTaskId: {
        live: { activeColaboratorCount: 2, unassignedSubTaskCount: 1 },
      },
      assignedCountByColaboratorId: { "u-1": 2 },
      totalsByTaskId: {
        live: { totalTimeSpent: 40, totalExpectedTime: 120 },
      },
    });

    expect(merged[0]).toMatchObject({
      documentId: "live",
      totalTimeSpent: 40,
      totalExpectedTime: 120,
      progressPending: false,
      progressNowMs: 1_700_000_000_000,
      activeColaboratorCount: 2,
      unassignedSubTaskCount: 1,
      progressInput: {
        openActivityStartedAts: ["2026-07-16T12:00:00.000Z"],
      },
    });
    expect(merged[1]).toBe(tasks[1]);
  });

  it("updates badges on waiting tasks without touching progress fields", () => {
    const waiting = taskStub({
      documentId: "waiting",
      status: "waiting",
      totalExpectedTime: 50,
      activeColaboratorCount: 0,
      unassignedSubTaskCount: 0,
    });

    const merged = mergeBoardProgressPoll([waiting], {
      nowMs: 1_700_000_000_000,
      progressByTaskId: {},
      badgesByTaskId: {
        waiting: { activeColaboratorCount: 0, unassignedSubTaskCount: 3 },
      },
      assignedCountByColaboratorId: {},
      totalsByTaskId: {},
    });

    expect(merged[0]).toMatchObject({
      documentId: "waiting",
      status: "waiting",
      unassignedSubTaskCount: 3,
      totalExpectedTime: 50,
    });
    expect(merged[0].progressInput).toBe(waiting.progressInput);
    expect(merged[0].progressNowMs).toBeUndefined();
    expect(merged[0].progressPending).toBeUndefined();
  });
});
