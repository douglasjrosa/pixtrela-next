import { describe, expect, it } from "vitest";

import {
  paginateQueueUnits,
  queueUnitCursor,
  splitQueueUnitsByKioskSection,
  type KioskQueueUnit,
} from "./kiosk-queue-units";
import type { KioskSubTask } from "./subtask-queue";

function subTask(
  partial: Pick<KioskSubTask, "documentId" | "name" | "index"> &
    Partial<KioskSubTask>,
): KioskSubTask {
  return {
    qty: 1,
    targetQty: 1,
    completedQty: 0,
    sharingType: "duration",
    timeSpent: 0,
    startedAt: null,
    expectedTime: 10,
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

function isolated(
  partial: Pick<KioskSubTask, "documentId" | "name" | "index"> &
    Partial<KioskSubTask>,
): KioskQueueUnit {
  return {
    type: "isolated",
    subTask: subTask(partial),
    helperMode: false,
    showStart: false,
  };
}

function group(
  members: KioskSubTask[],
  overrides: Partial<{ locked: boolean; principalActive: boolean }> = {},
): KioskQueueUnit {
  return {
    type: "group",
    headId: members[0]!.documentId,
    memberIds: members.map((item) => item.documentId),
    members,
    locked: overrides.locked ?? false,
    principalActive: overrides.principalActive ?? false,
    chainRunId: null,
    runStartedAt: null,
    showStart: false,
  };
}

describe("splitQueueUnitsByKioskSection", () => {
  it("splits producing, unlocked, locked, and finished", () => {
    const units: KioskQueueUnit[] = [
      isolated({
        documentId: "run",
        name: "Run",
        index: 0,
        status: "producing",
      }),
      isolated({ documentId: "free", name: "Free", index: 1 }),
      isolated({
        documentId: "lock",
        name: "Lock",
        index: 2,
        activationStatus: "locked",
      }),
      isolated({
        documentId: "done",
        name: "Done",
        index: 3,
        status: "finished",
      }),
    ];
    const sections = splitQueueUnitsByKioskSection(units);
    expect(sections.producing.map((u) => queueUnitCursor(u))).toEqual(["run"]);
    expect(sections.unlockedPending.map((u) => queueUnitCursor(u))).toEqual([
      "free",
    ]);
    expect(sections.locked.map((u) => queueUnitCursor(u))).toEqual(["lock"]);
    expect(sections.finishedToday.map((u) => queueUnitCursor(u))).toEqual([
      "done",
    ]);
  });

  it("treats locked groups as blocked and active groups as producing", () => {
    const lockedGroup = group(
      [
        subTask({ documentId: "a", name: "A", index: 0 }),
        subTask({
          documentId: "b",
          name: "B",
          index: 1,
          linkedToPrevious: true,
        }),
      ],
      { locked: true },
    );
    const activeGroup = group(
      [
        subTask({
          documentId: "c",
          name: "C",
          index: 2,
          status: "producing",
        }),
        subTask({
          documentId: "d",
          name: "D",
          index: 3,
          linkedToPrevious: true,
        }),
      ],
      { principalActive: true },
    );
    const sections = splitQueueUnitsByKioskSection([lockedGroup, activeGroup]);
    expect(sections.locked).toHaveLength(1);
    expect(sections.producing).toHaveLength(1);
  });
});

describe("paginateQueueUnits", () => {
  const units: KioskQueueUnit[] = [
    isolated({ documentId: "u1", name: "1", index: 0 }),
    isolated({ documentId: "u2", name: "2", index: 1 }),
    group([
      subTask({ documentId: "g1", name: "G1", index: 2 }),
      subTask({
        documentId: "g2",
        name: "G2",
        index: 3,
        linkedToPrevious: true,
      }),
    ]),
    isolated({ documentId: "u4", name: "4", index: 4 }),
  ];

  it("returns the first page and a cursor", () => {
    const page = paginateQueueUnits(units, { limit: 2 });
    expect(page.units.map(queueUnitCursor)).toEqual(["u1", "u2"]);
    expect(page.nextCursor).toBe("u2");
    expect(page.hasMore).toBe(true);
  });

  it("continues from cursor and keeps chain groups atomic", () => {
    const page = paginateQueueUnits(units, { limit: 2, cursor: "u2" });
    expect(page.units.map(queueUnitCursor)).toEqual(["g1", "u4"]);
    expect(page.units[0]).toMatchObject({
      type: "group",
      memberIds: ["g1", "g2"],
    });
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();
  });

  it("returns empty when cursor is the last unit", () => {
    const page = paginateQueueUnits(units, { limit: 10, cursor: "u4" });
    expect(page.units).toEqual([]);
    expect(page.hasMore).toBe(false);
  });
});
