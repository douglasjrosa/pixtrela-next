import { describe, expect, it } from "vitest";

import {
  canJoinLiveChain,
  nextJoinableSibling,
  nextJoinableSubTask,
  normalizeKioskLiveChainIntervalSeconds,
  sumExpectedTime,
} from "./kiosk-live-chain";
import type { KioskSubTask } from "./subtask-queue";

function member(
  partial: Pick<KioskSubTask, "documentId" | "index"> & Partial<KioskSubTask>,
): KioskSubTask {
  return {
    name: partial.documentId,
    qty: 1,
    targetQty: 1,
    completedQty: 0,
    sharingType: "duration",
    timeSpent: 0,
    startedAt: null,
    expectedTime: 100,
    taskDocumentId: "task-1",
    taskName: "Task",
    taskIndex: 0,
    finishedAt: null,
    activeWorkerCount: 0,
    status: "waiting",
    activationStatus: "unlocked",
    linkedToPrevious: false,
    maxSameTimeWorkers: 1,
    assignedToIds: ["u1"],
    dependencyIds: [],
    ...partial,
  };
}

describe("kiosk live chain budget", () => {
  it("sums expected times", () => {
    expect(sumExpectedTime([{ expectedTime: 100 }, { expectedTime: 100 }])).toBe(
      200,
    );
  });

  it("allows the second and third 100s under a 300 cap, not the fourth", () => {
    const live = [{ expectedTime: 100 }];
    expect(
      canJoinLiveChain({
        maxIntervalSeconds: 300,
        liveMembers: live,
        candidateExpectedTime: 100,
      }),
    ).toBe(true);
    expect(
      canJoinLiveChain({
        maxIntervalSeconds: 300,
        liveMembers: [{ expectedTime: 100 }, { expectedTime: 100 }],
        candidateExpectedTime: 100,
      }),
    ).toBe(true);
    expect(
      canJoinLiveChain({
        maxIntervalSeconds: 300,
        liveMembers: [
          { expectedTime: 100 },
          { expectedTime: 100 },
          { expectedTime: 100 },
        ],
        candidateExpectedTime: 100,
      }),
    ).toBe(false);
  });

  it("rejects joins when the cap is 0", () => {
    expect(
      canJoinLiveChain({
        maxIntervalSeconds: 0,
        liveMembers: [{ expectedTime: 100 }],
        candidateExpectedTime: 100,
      }),
    ).toBe(false);
  });

  it("normalizes invalid interval values to the default", () => {
    expect(normalizeKioskLiveChainIntervalSeconds(Number.NaN)).toBe(300);
    expect(normalizeKioskLiveChainIntervalSeconds(-4)).toBe(0);
  });
});

describe("nextJoinableSibling", () => {
  const siblings = [0, 1, 2, 3, 4].map((index) =>
    member({ documentId: `s${index}`, index, expectedTime: 100 }),
  );
  const assigned = new Set(siblings.map((item) => item.documentId));

  it("returns the immediate next sibling when the budget fits", () => {
    const next = nextJoinableSibling({
      liveMembers: [siblings[0]!],
      siblings,
      viewerAssignedIds: assigned,
      maxIntervalSeconds: 300,
    });
    expect(next?.documentId).toBe("s1");
  });

  it("returns the third after two are already in the live chain", () => {
    const next = nextJoinableSibling({
      liveMembers: [siblings[0]!, siblings[1]!],
      siblings,
      viewerAssignedIds: assigned,
      maxIntervalSeconds: 300,
    });
    expect(next?.documentId).toBe("s2");
  });

  it("returns null for the fourth under a 300 cap", () => {
    const next = nextJoinableSibling({
      liveMembers: [siblings[0]!, siblings[1]!, siblings[2]!],
      siblings,
      viewerAssignedIds: assigned,
      maxIntervalSeconds: 300,
    });
    expect(next).toBeNull();
  });

  it("does not join a sibling from another parent task", () => {
    const next = nextJoinableSibling({
      liveMembers: [siblings[0]!],
      siblings: [
        siblings[0]!,
        member({
          documentId: "other",
          index: 1,
          taskDocumentId: "task-2",
          expectedTime: 10,
        }),
      ],
      viewerAssignedIds: new Set(["s0", "other"]),
      maxIntervalSeconds: 300,
    });
    expect(next).toBeNull();
  });
});

describe("nextJoinableSubTask", () => {
  it("picks the next same-task sibling while the first is producing", () => {
    const subTasks = [
      member({
        documentId: "s0",
        index: 0,
        status: "producing",
        startedAt: "2026-08-16T12:00:00.000Z",
      }),
      member({
        documentId: "s1",
        index: 1,
        activationStatus: "locked",
      }),
    ];
    const next = nextJoinableSubTask({
      viewerId: "u1",
      subTasks,
      maxIntervalSeconds: 300,
    });
    expect(next?.documentId).toBe("s1");
  });
});
