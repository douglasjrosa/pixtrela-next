import { describe, expect, it } from "vitest";

import type { KioskSubTask } from "@/lib/business/subtask-queue";

import {
  applyOptimisticKioskStartToOpenRuns,
  applyOptimisticKioskStartToSubTasks,
  isOptimisticKioskStartSettled,
  OPTIMISTIC_CHAIN_RUN_PREFIX,
} from "./kiosk-optimistic-start";

function stub(overrides: Partial<KioskSubTask> = {}): KioskSubTask {
  return {
    documentId: "st-1",
    name: "Cortar",
    index: 0,
    status: "waiting",
    activationStatus: "unlocked",
    qty: 1,
    targetQty: 1,
    completedQty: 0,
    sharingType: "duration",
    timeSpent: 0,
    startedAt: null,
    expectedTime: 60,
    taskDocumentId: "task-1",
    taskName: "Caixa",
    taskIndex: 0,
    finishedAt: null,
    activeWorkerCount: 0,
    ...overrides,
  };
}

describe("kiosk optimistic start", () => {
  it("moves the started subtask to producing with a session", () => {
    const startedAt = "2026-08-17T23:00:00.000Z";
    const next = applyOptimisticKioskStartToSubTasks([stub(), stub({
      documentId: "st-2",
      name: "Embalar",
    })], {
      documentId: "st-1",
      startedAt,
      mode: "solo",
    });

    expect(next[0]).toMatchObject({
      documentId: "st-1",
      status: "producing",
      startedAt,
      activeWorkerCount: 1,
    });
    expect(next[1]?.status).toBe("waiting");
  });

  it("adds an optimistic open run for a chain start", () => {
    const startedAt = "2026-08-17T23:00:00.000Z";
    const runs = applyOptimisticKioskStartToOpenRuns([], {
      documentId: "st-1",
      startedAt,
      mode: "chain",
      chainHeadId: "st-1",
    }, "user-1");

    expect(runs).toEqual([
      {
        chainHeadId: "st-1",
        chainRunId: `${OPTIMISTIC_CHAIN_RUN_PREFIX}st-1`,
        principalId: "user-1",
        runStartedAt: startedAt,
      },
    ]);
  });

  it("settles when the server queue already has a session", () => {
    expect(
      isOptimisticKioskStartSettled(
        [stub({ startedAt: "2026-08-17T23:00:01.000Z", status: "producing" })],
        {
          documentId: "st-1",
          startedAt: "2026-08-17T23:00:00.000Z",
          mode: "solo",
        },
      ),
    ).toBe(true);
    expect(
      isOptimisticKioskStartSettled([stub()], {
        documentId: "st-1",
        startedAt: "2026-08-17T23:00:00.000Z",
        mode: "solo",
      }),
    ).toBe(false);
  });
});