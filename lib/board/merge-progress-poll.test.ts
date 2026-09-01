import { describe, expect, it } from "vitest";

import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import type { BoardColumnState } from "@/lib/board/board-column-state";
import {
  mergeBoardColumnsProgressPoll,
  mergeBoardProgressPoll,
} from "./merge-progress-poll";

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

const steps: KanbanStep[] = [
  {
    id: 0,
    documentId: "step-a",
    name: "A",
    taskOrderBy: "manual",
    tasksPerLoad: 10,
  },
  {
    id: 1,
    documentId: "step-b",
    name: "B",
    taskOrderBy: "manual",
    tasksPerLoad: 10,
  },
];

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
        live: {
          activeColaboratorCount: 2,
          unassignedSubTaskCount: 1,
          participantCount: 0,
        },
      },
      assignedCountByColaboratorId: { "u-1": 2 },
      totalsByTaskId: {
        live: { totalTimeSpent: 40, totalExpectedTime: 120 },
      },
      layoutByTaskId: {},
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

  it("loads progress for waiting tasks from the snapshot", () => {
    const waiting = taskStub({
      documentId: "waiting",
      status: "waiting",
      totalExpectedTime: 50,
      progressPending: true,
    });

    const merged = mergeBoardProgressPoll([waiting], {
      nowMs: 1_700_000_000_000,
      progressByTaskId: {
        waiting: {
          subTasks: [{ status: "waiting", expectedTime: 50, timeSpent: 10 }],
          openActivityStartedAts: [],
        },
      },
      badgesByTaskId: {
        waiting: {
          activeColaboratorCount: 0,
          unassignedSubTaskCount: 3,
          participantCount: 0,
        },
      },
      assignedCountByColaboratorId: {},
      totalsByTaskId: {
        waiting: { totalTimeSpent: 10, totalExpectedTime: 50 },
      },
      layoutByTaskId: {},
    });

    expect(merged[0]).toMatchObject({
      documentId: "waiting",
      status: "waiting",
      unassignedSubTaskCount: 3,
      totalTimeSpent: 10,
      totalExpectedTime: 50,
      progressPending: false,
      progressNowMs: 1_700_000_000_000,
      progressInput: {
        subTasks: [{ status: "waiting", expectedTime: 50, timeSpent: 10 }],
        openActivityStartedAts: [],
      },
    });
  });

  it("updates badges on waiting tasks without clearing existing progress", () => {
    const waiting = taskStub({
      documentId: "waiting",
      status: "waiting",
      totalExpectedTime: 50,
      activeColaboratorCount: 0,
      unassignedSubTaskCount: 0,
      progressInput: {
        subTasks: [{ status: "waiting", expectedTime: 50, timeSpent: 5 }],
        openActivityStartedAts: [],
      },
      progressNowMs: 1_699_999_000_000,
    });

    const merged = mergeBoardProgressPoll([waiting], {
      nowMs: 1_700_000_000_000,
      progressByTaskId: {},
      badgesByTaskId: {
        waiting: {
          activeColaboratorCount: 0,
          unassignedSubTaskCount: 3,
          participantCount: 0,
        },
      },
      assignedCountByColaboratorId: {},
      totalsByTaskId: {},
      layoutByTaskId: {},
    });

    expect(merged[0]).toMatchObject({
      documentId: "waiting",
      status: "waiting",
      unassignedSubTaskCount: 3,
      totalExpectedTime: 50,
      progressPending: false,
      progressNowMs: 1_699_999_000_000,
    });
    expect(merged[0].progressInput).toEqual(waiting.progressInput);
  });

  it("merges task layout fields from the snapshot", () => {
    const tasks = [
      taskStub({
        documentId: "task-1",
        status: "waiting",
        stepId: 0,
        index: 0,
        name: "Old name",
      }),
    ];

    const merged = mergeBoardProgressPoll(tasks, {
      nowMs: 1_700_000_000_000,
      progressByTaskId: {},
      badgesByTaskId: {},
      assignedCountByColaboratorId: {},
      totalsByTaskId: {},
      layoutByTaskId: {
        "task-1": {
          status: "producing",
          stepId: 2,
          index: 5,
          name: "New name",
          qty: 3,
          deliveryDate: "2026-08-01",
          endedAt: null,
        },
      },
    });

    expect(merged[0]).toMatchObject({
      status: "producing",
      stepId: 2,
      index: 5,
      name: "New name",
      qty: 3,
      deliveryDate: "2026-08-01",
    });
  });
});

describe("mergeBoardColumnsProgressPoll", () => {
  it("moves a loaded card between columns and adjusts totals", () => {
    const columns: BoardColumnState[] = [
      {
        stepDocumentId: "step-a",
        totalCount: 1,
        cursor: null,
        loadingMore: false,
        loadMoreError: false,
        tasks: [taskStub({ documentId: "t1", stepId: 0, index: 0, id: 10 })],
      },
      {
        stepDocumentId: "step-b",
        totalCount: 0,
        cursor: null,
        loadingMore: false,
        loadMoreError: false,
        tasks: [],
      },
    ];

    const merged = mergeBoardColumnsProgressPoll(columns, steps, {
      nowMs: 1,
      progressByTaskId: {},
      badgesByTaskId: {},
      assignedCountByColaboratorId: {},
      totalsByTaskId: {},
      totalCountByStepId: { "step-a": 0, "step-b": 1 },
      layoutByTaskId: {
        t1: {
          status: "waiting",
          stepId: 1,
          index: 0,
          name: "Task",
          qty: 1,
          deliveryDate: null,
          endedAt: null,
        },
      },
    });

    expect(merged[0]?.tasks).toHaveLength(0);
    expect(merged[0]?.totalCount).toBe(0);
    expect(merged[1]?.tasks.map((task) => task.documentId)).toEqual(["t1"]);
    expect(merged[1]?.totalCount).toBe(1);
  });

  it("removes a loaded card that disappeared from layout", () => {
    const columns: BoardColumnState[] = [
      {
        stepDocumentId: "step-a",
        totalCount: 1,
        cursor: null,
        loadingMore: false,
        loadMoreError: false,
        tasks: [taskStub({ documentId: "gone", stepId: 0, index: 0 })],
      },
      {
        stepDocumentId: "step-b",
        totalCount: 0,
        cursor: null,
        loadingMore: false,
        loadMoreError: false,
        tasks: [],
      },
    ];

    const merged = mergeBoardColumnsProgressPoll(columns, steps, {
      nowMs: 1,
      progressByTaskId: {},
      badgesByTaskId: {},
      assignedCountByColaboratorId: {},
      totalsByTaskId: {},
      totalCountByStepId: { "step-a": 0, "step-b": 0 },
      layoutByTaskId: {},
    });

    expect(merged[0]?.tasks).toHaveLength(0);
    expect(merged[0]?.totalCount).toBe(0);
  });
});
