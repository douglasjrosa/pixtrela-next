import { describe, expect, it } from "vitest";

import {
  allocateChainTimeline,
  elapsedSecondsBetween,
  isFinishedThisRun,
  msUntilNextAutoAdvance,
  planPrincipalSegmentActivities,
  resolveChainAutoAdvance,
  statusAfterChainTimeAdvance,
} from "./subtask-chain-allocation";

const T0 = new Date("2026-08-16T12:00:00.000Z");

function secondsLater(seconds: number): Date {
  return new Date(T0.getTime() + seconds * 1000);
}

describe("isFinishedThisRun", () => {
  it("uses duration completed flag", () => {
    const member = {
      documentId: "a",
      expectedTime: 10,
      sharingType: "duration" as const,
      targetQty: 1,
      completedQtyBefore: 0,
    };
    expect(isFinishedThisRun(member, { documentId: "a", completed: true })).toBe(
      true,
    );
    expect(
      isFinishedThisRun(member, { documentId: "a", completed: false }),
    ).toBe(false);
  });

  it("finishes qty when reported pieces reach the target", () => {
    const member = {
      documentId: "a",
      expectedTime: 10,
      sharingType: "qty" as const,
      targetQty: 5,
      completedQtyBefore: 3,
    };
    expect(isFinishedThisRun(member, { documentId: "a", qty: 2 })).toBe(true);
    expect(isFinishedThisRun(member, { documentId: "a", qty: 1 })).toBe(false);
  });
});

describe("allocateChainTimeline", () => {
  it("splits elapsed across finished members by expected time", () => {
    const result = allocateChainTimeline({
      runStartedAt: T0,
      stopAt: secondsLater(30),
      finishedThisRun: [
        { documentId: "a", expectedTime: 10 },
        { documentId: "b", expectedTime: 20 },
      ],
    });
    expect(result.elapsedSeconds).toBe(30);
    expect(result.segments.map((row) => row.timeSpent)).toEqual([10, 20]);
    expect(result.segments[0]?.startedAt.toISOString()).toBe(T0.toISOString());
    expect(result.segments[1]?.stoppedAt.toISOString()).toBe(
      secondsLater(30).toISOString(),
    );
  });

  it("dilutes overtime across all finished members", () => {
    const result = allocateChainTimeline({
      runStartedAt: T0,
      stopAt: secondsLater(90),
      finishedThisRun: [
        { documentId: "a", expectedTime: 10 },
        { documentId: "b", expectedTime: 20 },
        { documentId: "c", expectedTime: 30 },
      ],
    });
    expect(result.segments.map((row) => row.timeSpent)).toEqual([15, 30, 45]);
  });

  it("excludes pending members from the split", () => {
    const result = allocateChainTimeline({
      runStartedAt: T0,
      stopAt: secondsLater(15),
      finishedThisRun: [{ documentId: "a", expectedTime: 10 }],
    });
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]?.timeSpent).toBe(15);
  });

  it("adds extra helper seconds into elapsed", () => {
    const result = allocateChainTimeline({
      runStartedAt: T0,
      stopAt: secondsLater(30),
      extraHelperSeconds: 10,
      finishedThisRun: [
        { documentId: "a", expectedTime: 10 },
        { documentId: "b", expectedTime: 20 },
      ],
    });
    expect(result.elapsedSeconds).toBe(40);
    expect(result.segments.map((row) => row.timeSpent)).toEqual([13, 27]);
  });
});

describe("resolveChainAutoAdvance", () => {
  const remaining = [
    { documentId: "a", expectedTime: 10 },
    { documentId: "b", expectedTime: 20 },
    { documentId: "c", expectedTime: 30 },
  ];

  it("stays on the first member before its expected time", () => {
    expect(
      resolveChainAutoAdvance({
        runStartedAt: T0,
        now: secondsLater(9),
        remainingOrdered: remaining,
      }),
    ).toEqual({ completedIds: [], currentId: "a" });
  });

  it("advances after cumulative expected and never auto-stops the last", () => {
    expect(
      resolveChainAutoAdvance({
        runStartedAt: T0,
        now: secondsLater(10),
        remainingOrdered: remaining,
      }),
    ).toEqual({ completedIds: ["a"], currentId: "b" });
    expect(
      resolveChainAutoAdvance({
        runStartedAt: T0,
        now: secondsLater(100),
        remainingOrdered: remaining,
      }),
    ).toEqual({ completedIds: ["a", "b"], currentId: "c" });
  });

  it("does not auto-stop a single remaining member", () => {
    expect(
      resolveChainAutoAdvance({
        runStartedAt: T0,
        now: secondsLater(50),
        remainingOrdered: [{ documentId: "c", expectedTime: 30 }],
      }),
    ).toEqual({ completedIds: [], currentId: "c" });
  });
});

describe("statusAfterChainTimeAdvance", () => {
  it("pauses the rolled member when no helper is still open", () => {
    expect(statusAfterChainTimeAdvance(false)).toBe("paused");
  });

  it("keeps producing when a helper session is still open", () => {
    expect(statusAfterChainTimeAdvance(true)).toBe("producing");
  });
});

describe("planPrincipalSegmentActivities", () => {
  it("emits start and stop per segment", () => {
    const { segments } = allocateChainTimeline({
      runStartedAt: T0,
      stopAt: secondsLater(30),
      finishedThisRun: [
        { documentId: "a", expectedTime: 10 },
        { documentId: "b", expectedTime: 20 },
      ],
    });
    const planned = planPrincipalSegmentActivities({
      principalId: "u1",
      segments,
      qtyBySubTaskId: { b: 2 },
    });
    expect(planned).toHaveLength(4);
    expect(planned.map((row) => row.action)).toEqual([
      "started",
      "stoped",
      "started",
      "stoped",
    ]);
    expect(planned[3]?.qty).toBe(2);
  });
});

describe("msUntilNextAutoAdvance", () => {
  it("returns remaining ms until the next boundary", () => {
    expect(
      msUntilNextAutoAdvance({
        runStartedAt: T0,
        now: secondsLater(4),
        remainingOrdered: [
          { documentId: "a", expectedTime: 10 },
          { documentId: "b", expectedTime: 20 },
        ],
      }),
    ).toBe(6000);
  });

  it("returns null on the last member", () => {
    expect(
      msUntilNextAutoAdvance({
        runStartedAt: T0,
        now: secondsLater(11),
        remainingOrdered: [
          { documentId: "a", expectedTime: 10 },
          { documentId: "b", expectedTime: 20 },
        ],
      }),
    ).toBeNull();
  });
});

describe("elapsedSecondsBetween", () => {
  it("floors positive deltas and clamps non-positive", () => {
    expect(elapsedSecondsBetween(T0, secondsLater(1.9))).toBe(1);
    expect(elapsedSecondsBetween(secondsLater(2), T0)).toBe(0);
  });
});
