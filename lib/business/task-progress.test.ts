import { describe, expect, it } from "vitest";

import {
  isOverExpected,
  listOpenActivityStartedAts,
  resolveOpenSessionsElapsedSeconds,
  resolveProgressFillPercent,
  resolveProgressMarkPercent,
  resolveProgressScaleSeconds,
  resolveTaskRemainingSeconds,
  shouldShowKanbanTaskProgress,
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

describe("progress bar geometry", () => {
  it("places the mark at expected and fill at spent over the scale", () => {
    expect(resolveProgressScaleSeconds(100, 40)).toBe(100);
    expect(resolveProgressMarkPercent(100, 40)).toBe(100);
    expect(resolveProgressFillPercent(100, 40)).toBe(40);

    expect(resolveProgressScaleSeconds(100, 150)).toBe(150);
    expect(resolveProgressMarkPercent(100, 150)).toBeCloseTo((100 / 150) * 100);
    expect(resolveProgressFillPercent(100, 150)).toBe(100);
  });
});

describe("isOverExpected", () => {
  it("detects spent past expected", () => {
    expect(isOverExpected(101, 100)).toBe(true);
    expect(isOverExpected(100, 100)).toBe(false);
  });
});

describe("shouldShowKanbanTaskProgress", () => {
  it("shows only for producing and paused", () => {
    expect(shouldShowKanbanTaskProgress("producing")).toBe(true);
    expect(shouldShowKanbanTaskProgress("paused")).toBe(true);
    expect(shouldShowKanbanTaskProgress("waiting")).toBe(false);
    expect(shouldShowKanbanTaskProgress("finished")).toBe(false);
  });
});
