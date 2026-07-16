import { describe, expect, it } from "vitest";

import {
  aggregateSessionTotals,
  isOverExpected,
  listActivitySessions,
  listOpenActivityStartedAts,
  needsLiveBoardProgress,
  resolveLiveTimeSpent,
  resolveOpenSessionsElapsedSeconds,
  resolvePersistedRemainingSeconds,
  resolveProgressFillPercent,
  resolveProgressMarkPercent,
  resolveProgressOkFillPercent,
  resolveProgressOverFillPercent,
  resolveProgressScaleSeconds,
  resolveSubTaskRemainingSeconds,
  resolveTaskRemainingSeconds,
  shouldShowKanbanTaskProgress,
  shouldShowSubTaskProgress,
} from "./task-progress";

describe("resolveTaskRemainingSeconds", () => {
  const nowMs = Date.parse("2026-07-16T12:00:00.000Z");

  it("uses expected minus spent on unfinished counted sub-tasks, minus live opens", () => {
    const remaining = resolveTaskRemainingSeconds(
      [
        { status: "finished", expectedTime: 100, timeSpent: 90 },
        { status: "waiting", expectedTime: 60, timeSpent: 10 },
        { status: "producing", expectedTime: 120, timeSpent: 30 },
        { status: "paused", expectedTime: 40, timeSpent: 10 },
        {
          status: "waiting",
          expectedTime: 200,
          timeSpent: 0,
          activationStatus: "disabled",
        },
      ],
      ["2026-07-16T11:59:00.000Z"],
      nowMs,
    );

    // waiting: 60-10=50; producing: 120-30=90; paused: 40-10=30; open: 60
    // finished and disabled ignored
    expect(remaining).toBe(110);
  });

  it("can return a negative remaining", () => {
    expect(
      resolveTaskRemainingSeconds(
        [{ status: "producing", expectedTime: 30, timeSpent: 20 }],
        ["2026-07-16T11:59:00.000Z"],
        nowMs,
      ),
    ).toBe(-50);
  });
});

describe("resolveLiveTimeSpent", () => {
  const nowMs = Date.parse("2026-07-16T12:00:00.000Z");

  it("adds person-seconds from parallel open sessions to persisted spent", () => {
    // 2 workers open for 60s wall => +120 person-seconds
    expect(
      resolveLiveTimeSpent(
        100,
        ["2026-07-16T11:59:00.000Z", "2026-07-16T11:59:00.000Z"],
        nowMs,
      ),
    ).toBe(220);
  });
});

describe("resolvePersistedRemainingSeconds", () => {
  it("returns expected minus spent for finished tasks", () => {
    expect(resolvePersistedRemainingSeconds(300, 250)).toBe(50);
    expect(resolvePersistedRemainingSeconds(300, 400)).toBe(-100);
  });
});

describe("resolveSubTaskRemainingSeconds", () => {
  const nowMs = Date.parse("2026-07-16T12:00:00.000Z");

  it("subtracts live spent from expected", () => {
    expect(
      resolveSubTaskRemainingSeconds(
        300,
        100,
        ["2026-07-16T11:59:00.000Z"],
        nowMs,
      ),
    ).toBe(140);
  });
});

describe("resolveOpenSessionsElapsedSeconds", () => {
  it("sums elapsed open sessions", () => {
    const nowMs = Date.parse("2026-07-16T12:00:00.000Z");
    expect(
      resolveOpenSessionsElapsedSeconds(
        ["2026-07-16T11:59:00.000Z", "2026-07-16T11:58:00.000Z"],
        nowMs,
      ),
    ).toBe(180);
  });
});

describe("listOpenActivityStartedAts", () => {
  it("keeps only open started sessions per colaborator and subtask", () => {
    const opens = listOpenActivityStartedAts([
      {
        subTaskDocumentId: "st-1",
        colaboratorDocumentId: "u-1",
        action: "started",
        timestamp: "2026-07-16T10:00:00.000Z",
      },
      {
        subTaskDocumentId: "st-1",
        colaboratorDocumentId: "u-1",
        action: "stoped",
        timestamp: "2026-07-16T10:05:00.000Z",
      },
      {
        subTaskDocumentId: "st-1",
        colaboratorDocumentId: "u-2",
        action: "started",
        timestamp: "2026-07-16T11:00:00.000Z",
      },
      {
        subTaskDocumentId: "st-1",
        colaboratorDocumentId: "u-1",
        action: "started",
        timestamp: "2026-07-16T11:30:00.000Z",
      },
    ]);

    expect(opens.sort()).toEqual([
      "2026-07-16T11:00:00.000Z",
      "2026-07-16T11:30:00.000Z",
    ]);
  });
});

describe("listActivitySessions", () => {
  it("pairs started and stoped into closed sessions with duration and qty", () => {
    const sessions = listActivitySessions([
      {
        subTaskDocumentId: "st-1",
        colaboratorDocumentId: "u-1",
        colaboratorName: "Ana",
        action: "started",
        timestamp: "2026-07-16T10:00:00.000Z",
      },
      {
        subTaskDocumentId: "st-1",
        colaboratorDocumentId: "u-1",
        colaboratorName: "Ana",
        action: "stoped",
        timestamp: "2026-07-16T10:02:00.000Z",
        qty: 5,
      },
      {
        subTaskDocumentId: "st-1",
        colaboratorDocumentId: "u-2",
        colaboratorName: "Bia",
        action: "started",
        timestamp: "2026-07-16T10:01:00.000Z",
      },
    ]);

    expect(sessions).toEqual([
      {
        colaboratorDocumentId: "u-1",
        colaboratorName: "Ana",
        startedAt: "2026-07-16T10:00:00.000Z",
        finishedAt: "2026-07-16T10:02:00.000Z",
        durationSec: 120,
        qty: 5,
      },
    ]);
  });
});

describe("aggregateSessionTotals", () => {
  it("sums duration and qty per colaborator", () => {
    const totals = aggregateSessionTotals([
      {
        colaboratorDocumentId: "u-1",
        colaboratorName: "Ana",
        startedAt: "a",
        finishedAt: "b",
        durationSec: 60,
        qty: 2,
      },
      {
        colaboratorDocumentId: "u-1",
        colaboratorName: "Ana",
        startedAt: "c",
        finishedAt: "d",
        durationSec: 40,
        qty: 3,
      },
      {
        colaboratorDocumentId: "u-2",
        colaboratorName: "Bia",
        startedAt: "e",
        finishedAt: "f",
        durationSec: 100,
        qty: 1,
      },
    ]);

    expect(totals).toEqual([
      {
        colaboratorDocumentId: "u-1",
        colaboratorName: "Ana",
        totalDurationSec: 100,
        totalQty: 5,
      },
      {
        colaboratorDocumentId: "u-2",
        colaboratorName: "Bia",
        totalDurationSec: 100,
        totalQty: 1,
      },
    ]);
  });
});

describe("progress bar geometry", () => {
  it("places the mark at expected and fill at spent over the scale", () => {
    expect(resolveProgressScaleSeconds(100, 40)).toBe(100);
    expect(resolveProgressMarkPercent(100, 40)).toBe(100);
    expect(resolveProgressFillPercent(100, 40)).toBe(40);

    expect(resolveProgressScaleSeconds(100, 150)).toBe(150);
    expect(resolveProgressMarkPercent(100, 150)).toBeCloseTo((100 / 150) * 100);
    expect(resolveProgressFillPercent(100, 150)).toBe(100);
  });

  it("splits ok (green) and over (red) fill segments", () => {
    expect(resolveProgressOkFillPercent(100, 40)).toBe(40);
    expect(resolveProgressOverFillPercent(100, 40)).toBe(0);

    expect(resolveProgressOkFillPercent(100, 150)).toBeCloseTo((100 / 150) * 100);
    expect(resolveProgressOverFillPercent(100, 150)).toBeCloseTo((50 / 150) * 100);
  });
});

describe("isOverExpected", () => {
  it("detects spent past expected", () => {
    expect(isOverExpected(101, 100)).toBe(true);
    expect(isOverExpected(100, 100)).toBe(false);
  });
});

describe("shouldShowKanbanTaskProgress", () => {
  it("shows for every status except waiting", () => {
    expect(shouldShowKanbanTaskProgress("producing")).toBe(true);
    expect(shouldShowKanbanTaskProgress("paused")).toBe(true);
    expect(shouldShowKanbanTaskProgress("finished")).toBe(true);
    expect(shouldShowKanbanTaskProgress("waiting")).toBe(false);
  });
});

describe("needsLiveBoardProgress", () => {
  it("is true only for producing and paused", () => {
    expect(needsLiveBoardProgress("producing")).toBe(true);
    expect(needsLiveBoardProgress("paused")).toBe(true);
    expect(needsLiveBoardProgress("finished")).toBe(false);
    expect(needsLiveBoardProgress("waiting")).toBe(false);
  });
});

describe("shouldShowSubTaskProgress", () => {
  it("hides only waiting subtasks", () => {
    expect(shouldShowSubTaskProgress("waiting")).toBe(false);
    expect(shouldShowSubTaskProgress("finished")).toBe(true);
    expect(shouldShowSubTaskProgress("producing")).toBe(true);
  });
});
