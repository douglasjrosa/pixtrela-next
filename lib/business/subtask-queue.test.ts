import { describe, expect, it } from "vitest";

import {
  canStartSubTask,
  canStopSubTask,
  hasActiveSubTask,
  isFinishedSubTask,
  isLockedSubTask,
  nextStartableSubTask,
  shouldShowExitButton,
  shouldShowStartButton,
  sortSubTasksByIndex,
  splitKioskQueueSections,
} from "./subtask-queue";

const subTasks = [
  {
    documentId: "b",
    name: "B",
    index: 1,
    status: "waiting" as const,
    activationStatus: "unlocked" as const,
  },
  {
    documentId: "a",
    name: "A",
    index: 0,
    status: "waiting" as const,
    activationStatus: "unlocked" as const,
  },
];

describe("sortSubTasksByIndex", () => {
  it("orders by index", () => {
    expect(sortSubTasksByIndex(subTasks).map((s) => s.documentId)).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("nextStartableSubTask", () => {
  it("returns first unlocked queued when none active", () => {
    expect(nextStartableSubTask(subTasks)?.documentId).toBe("a");
  });

  it("returns null when one is producing", () => {
    const active = [
      {
        documentId: "a",
        name: "A",
        index: 0,
        status: "producing" as const,
        activationStatus: "unlocked" as const,
      },
      {
        documentId: "b",
        name: "B",
        index: 1,
        status: "waiting" as const,
        activationStatus: "unlocked" as const,
      },
    ];
    expect(nextStartableSubTask(active)).toBeNull();
    expect(hasActiveSubTask(active)).toBe(true);
  });

  it("returns null for empty queue", () => {
    expect(nextStartableSubTask([])).toBeNull();
  });

  it("skips finished and returns next unlocked queued", () => {
    const mixed = [
      {
        documentId: "a",
        name: "A",
        index: 0,
        status: "finished" as const,
        activationStatus: "unlocked" as const,
      },
      {
        documentId: "b",
        name: "B",
        index: 1,
        status: "waiting" as const,
        activationStatus: "unlocked" as const,
      },
    ];
    expect(nextStartableSubTask(mixed)?.documentId).toBe("b");
  });

  it("skips locked queued subtasks", () => {
    const lockedFirst = [
      {
        documentId: "a",
        name: "A",
        index: 0,
        status: "waiting" as const,
        activationStatus: "locked" as const,
      },
      {
        documentId: "b",
        name: "B",
        index: 1,
        status: "waiting" as const,
        activationStatus: "unlocked" as const,
      },
    ];
    expect(nextStartableSubTask(lockedFirst)?.documentId).toBe("b");
  });
});

describe("canStartSubTask", () => {
  it("allows any unlocked queued subtask when none active", () => {
    expect(canStartSubTask(subTasks, "a")).toBe(true);
    expect(canStartSubTask(subTasks, "b")).toBe(true);
  });

  it("blocks locked queued subtasks", () => {
    const locked = [
      {
        documentId: "a",
        name: "A",
        index: 0,
        status: "waiting" as const,
        activationStatus: "locked" as const,
      },
    ];
    expect(canStartSubTask(locked, "a")).toBe(false);
  });

  it("treats missing activationStatus as locked", () => {
    const legacy = [
      {
        documentId: "a",
        name: "A",
        index: 0,
        status: "waiting" as const,
      },
    ];
    expect(canStartSubTask(legacy, "a")).toBe(false);
  });

  it("blocks start when another subtask is producing", () => {
    const active = [
      {
        documentId: "a",
        name: "A",
        index: 0,
        status: "producing" as const,
        activationStatus: "unlocked" as const,
      },
      {
        documentId: "b",
        name: "B",
        index: 1,
        status: "waiting" as const,
        activationStatus: "unlocked" as const,
      },
    ];
    expect(canStartSubTask(active, "b")).toBe(false);
  });
});

describe("isFinishedSubTask", () => {
  it("detects finished status", () => {
    expect(
      isFinishedSubTask({
        documentId: "a",
        name: "A",
        index: 0,
        status: "finished",
      }),
    ).toBe(true);
    expect(
      isFinishedSubTask({
        documentId: "a",
        name: "A",
        index: 0,
        status: "waiting",
      }),
    ).toBe(false);
  });
});

describe("isLockedSubTask", () => {
  it("detects locked queued subtasks", () => {
    expect(
      isLockedSubTask({
        documentId: "a",
        name: "A",
        index: 0,
        status: "waiting",
        activationStatus: "locked",
      }),
    ).toBe(true);
  });

  it("treats missing activationStatus as locked", () => {
    expect(
      isLockedSubTask({
        documentId: "a",
        name: "A",
        index: 0,
        status: "waiting",
      }),
    ).toBe(true);
  });

  it("returns false for unlocked or finished subtasks", () => {
    expect(
      isLockedSubTask({
        documentId: "a",
        name: "A",
        index: 0,
        status: "waiting",
        activationStatus: "unlocked",
      }),
    ).toBe(false);
    expect(
      isLockedSubTask({
        documentId: "a",
        name: "A",
        index: 0,
        status: "finished",
        activationStatus: "locked",
      }),
    ).toBe(false);
  });
});

describe("canStopSubTask", () => {
  it("allows stop only when producing", () => {
    expect(
      canStopSubTask({
        documentId: "a",
        name: "A",
        index: 0,
        status: "producing",
      }),
    ).toBe(true);
    expect(
      canStopSubTask({
        documentId: "a",
        name: "A",
        index: 0,
        status: "waiting",
      }),
    ).toBe(false);
  });
});

describe("shouldShowStartButton", () => {
  it("shows start only for startable idle subtasks", () => {
    const queue = [
      {
        documentId: "a",
        name: "A",
        index: 0,
        status: "waiting" as const,
        activationStatus: "unlocked" as const,
      },
      {
        documentId: "b",
        name: "B",
        index: 1,
        status: "waiting" as const,
        activationStatus: "locked" as const,
      },
    ];
    expect(shouldShowStartButton(queue, queue[0])).toBe(true);
    expect(shouldShowStartButton(queue, queue[1])).toBe(false);
  });
});

describe("shouldShowExitButton", () => {
  it("shows exit only on the producing subtask", () => {
    const active = [
      {
        documentId: "a",
        name: "A",
        index: 0,
        status: "producing" as const,
        activationStatus: "unlocked" as const,
      },
      {
        documentId: "b",
        name: "B",
        index: 1,
        status: "waiting" as const,
        activationStatus: "unlocked" as const,
      },
    ];
    expect(shouldShowExitButton(active, active[0])).toBe(true);
    expect(shouldShowExitButton(active, active[1])).toBe(false);
  });
});

describe("splitKioskQueueSections", () => {
  it("groups subtasks by queue section", () => {
    const sections = splitKioskQueueSections([
      {
        documentId: "a",
        name: "A",
        index: 0,
        status: "producing",
        activationStatus: "unlocked",
        qty: 1,
        completedQty: 0,
        sharingType: "duration",
        timeSpent: 0,
        startedAt: null,
        expectedTime: 0,
        taskDocumentId: "t1",
        taskName: "Task",
        taskIndex: 0,
        finishedAt: null,
      },
      {
        documentId: "b",
        name: "B",
        index: 1,
        status: "waiting",
        activationStatus: "unlocked",
        qty: 1,
        completedQty: 0,
        sharingType: "duration",
        timeSpent: 0,
        startedAt: null,
        expectedTime: 0,
        taskDocumentId: "t1",
        taskName: "Task",
        taskIndex: 0,
        finishedAt: null,
      },
      {
        documentId: "c",
        name: "C",
        index: 2,
        status: "finished",
        activationStatus: "unlocked",
        qty: 1,
        completedQty: 0,
        sharingType: "duration",
        timeSpent: 10,
        startedAt: null,
        expectedTime: 0,
        taskDocumentId: "t1",
        taskName: "Task",
        taskIndex: 0,
        finishedAt: "2026-07-07T12:00:00.000Z",
      },
    ]);

    expect(sections.producing.map((item) => item.documentId)).toEqual(["a"]);
    expect(sections.pending.map((item) => item.documentId)).toEqual(["b"]);
    expect(sections.finishedToday.map((item) => item.documentId)).toEqual(["c"]);
  });
});
