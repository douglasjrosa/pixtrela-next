import { describe, expect, it } from "vitest";

import {
  collectKioskQueueCatalogScope,
  mergeKioskCatalog,
} from "./kiosk-queue-catalog-scope";
import type { KioskQueueUnit, OpenChainRun } from "./kiosk-queue-units";
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

function isolated(item: KioskSubTask): KioskQueueUnit {
  return {
    type: "isolated",
    subTask: item,
    helperMode: false,
    showStart: false,
  };
}

function group(members: KioskSubTask[]): KioskQueueUnit {
  return {
    type: "group",
    headId: members[0]!.documentId,
    memberIds: members.map((item) => item.documentId),
    members,
    locked: false,
    principalActive: false,
    chainRunId: null,
    runStartedAt: null,
    showStart: false,
  };
}

describe("collectKioskQueueCatalogScope", () => {
  const producing = subTask({
    documentId: "run",
    name: "Run",
    index: 0,
    status: "producing",
    startedAt: "2026-01-01T00:00:00.000Z",
  });
  const joinable = subTask({
    documentId: "join",
    name: "Join",
    index: 1,
    expectedTime: 10,
    linkedToPrevious: true,
  });
  const later = subTask({ documentId: "later", name: "Later", index: 2 });
  const otherTask = subTask({
    documentId: "other",
    name: "Other",
    index: 0,
    taskDocumentId: "task-2",
  });
  const chainA = subTask({ documentId: "chain-a", name: "A", index: 0 });
  const chainB = subTask({
    documentId: "chain-b",
    name: "B",
    index: 1,
    linkedToPrevious: true,
  });

  it("includes visible units, chain members, and the next joinable sibling", () => {
    const openRuns: OpenChainRun[] = [
      {
        chainHeadId: "chain-a",
        chainRunId: "run-1",
        principalId: "u1",
        runStartedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const ids = collectKioskQueueCatalogScope({
      viewerId: "u1",
      producingUnits: [isolated(producing)],
      pageUnits: [group([chainA, chainB])],
      openRuns,
      assignedSubTasks: [producing, joinable, later, chainA, chainB],
      fullCatalog: [producing, joinable, later, otherTask, chainA, chainB],
      maxIntervalSeconds: 60,
    });
    expect([...ids].sort()).toEqual(
      ["chain-a", "chain-b", "join", "run"].sort(),
    );
    expect(ids.has("other")).toBe(false);
    expect(ids.has("later")).toBe(false);
  });

  it("keeps only visible cards when nothing is producing", () => {
    const ids = collectKioskQueueCatalogScope({
      viewerId: "u1",
      producingUnits: [],
      pageUnits: [isolated(later)],
      openRuns: [],
      assignedSubTasks: [later, otherTask],
      fullCatalog: [later, otherTask],
      maxIntervalSeconds: 60,
    });
    expect([...ids]).toEqual(["later"]);
  });
});

describe("mergeKioskCatalog", () => {
  it("keeps previous ids and overwrites overlapping documentIds", () => {
    const previous = [
      subTask({ documentId: "a", name: "Old A", index: 0 }),
      subTask({ documentId: "b", name: "B", index: 1 }),
    ];
    const incoming = [
      subTask({ documentId: "a", name: "New A", index: 0, status: "producing" }),
      subTask({ documentId: "c", name: "C", index: 2 }),
    ];
    const merged = mergeKioskCatalog(previous, incoming);
    expect(merged.map((item) => item.documentId).sort()).toEqual(["a", "b", "c"]);
    expect(merged.find((item) => item.documentId === "a")?.name).toBe("New A");
    expect(merged.find((item) => item.documentId === "b")?.name).toBe("B");
  });
});
