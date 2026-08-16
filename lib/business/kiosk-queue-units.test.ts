import { describe, expect, it } from "vitest";

import { buildKioskQueueUnits, splitQueueUnitsBySection } from "./kiosk-queue-units";
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

describe("buildKioskQueueUnits", () => {
  const chained = [
    subTask({ documentId: "a", name: "Cut", index: 0 }),
    subTask({
      documentId: "b",
      name: "Pack",
      index: 1,
      linkedToPrevious: true,
      maxSameTimeWorkers: 2,
    }),
    subTask({
      documentId: "c",
      name: "Ship",
      index: 2,
      linkedToPrevious: true,
    }),
  ];

  it("renders a multi-member chain as one group card", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: chained,
    });
    expect(units).toHaveLength(1);
    expect(units[0]).toMatchObject({
      type: "group",
      headId: "a",
      memberIds: ["a", "b", "c"],
      principalActive: false,
    });
  });

  it("shows helpers only the spare-capacity member while the principal runs", () => {
    const units = buildKioskQueueUnits({
      viewerId: "helper",
      subTasks: chained.map((item) => ({
        ...item,
        assignedToIds: ["u1", "helper"],
        status: item.documentId === "a" ? "producing" : "waiting",
        activeWorkerCount: item.documentId === "a" ? 1 : 0,
      })),
      openRuns: [
        {
          chainHeadId: "a",
          chainRunId: "run-1",
          principalId: "u1",
          runStartedAt: "2026-08-16T12:00:00.000Z",
        },
      ],
    });
    expect(units).toEqual([
      expect.objectContaining({
        type: "isolated",
        helperMode: true,
        subTask: expect.objectContaining({ documentId: "b" }),
      }),
    ]);
  });

  it("hides extra helpers until the principal starts the chain", () => {
    const units = buildKioskQueueUnits({
      viewerId: "helper",
      subTasks: [
        chained[1]!,
      ].map((item) => ({
        ...item,
        assignedToIds: ["helper"],
      })),
      allTaskSubTasks: chained.map((item) =>
        item.documentId === "b"
          ? { ...item, assignedToIds: ["u1", "helper"] }
          : { ...item, assignedToIds: ["u1"] },
      ),
    });
    expect(units).toEqual([]);
  });

  it("locks the group when any member has an unfinished external dependency", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: chained.map((item) =>
        item.documentId === "c"
          ? { ...item, dependencyIds: ["outside"] }
          : item,
      ),
      allTaskSubTasks: [
        ...chained.map((item) =>
          item.documentId === "c"
            ? { ...item, dependencyIds: ["outside"] }
            : item,
        ),
        subTask({
          documentId: "outside",
          name: "Other",
          index: 9,
          status: "waiting",
        }),
      ],
    });
    expect(units[0]).toMatchObject({ type: "group", locked: true });
  });

  it("keeps unlinked rows isolated", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        subTask({ documentId: "solo", name: "Solo", index: 0 }),
      ],
    });
    expect(units[0]?.type).toBe("isolated");
  });
});

describe("splitQueueUnitsBySection", () => {
  it("puts an active group in producing", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        subTask({
          documentId: "a",
          name: "Cut",
          index: 0,
          status: "producing",
          startedAt: "2026-08-16T12:00:00.000Z",
        }),
        subTask({
          documentId: "b",
          name: "Pack",
          index: 1,
          linkedToPrevious: true,
        }),
      ],
      openRuns: [
        {
          chainHeadId: "a",
          chainRunId: "run-1",
          principalId: "u1",
          runStartedAt: "2026-08-16T12:00:00.000Z",
        },
      ],
    });
    const sections = splitQueueUnitsBySection(units);
    expect(sections.producing).toHaveLength(1);
    expect(sections.pending).toHaveLength(0);
  });
});
