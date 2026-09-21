import { describe, expect, it } from "vitest";

import type { KioskSubTask } from "@/lib/business/subtask-queue";

import {
  applyOptimisticChainStopToOpenRuns,
  applyOptimisticChainStopToSubTasks,
  applyOptimisticKioskStartToOpenRuns,
  applyOptimisticKioskStartToSubTasks,
  applyOptimisticStateToLiberadasSection,
  isOptimisticChainStopSettled,
  isOptimisticKioskStartSettled,
  OPTIMISTIC_CHAIN_RUN_PREFIX,
  resolvePersistedChainRunId,
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

  it("resolves a persisted chain run id from open runs", () => {
    expect(
      resolvePersistedChainRunId(
        `${OPTIMISTIC_CHAIN_RUN_PREFIX}st-1`,
        [
          {
            chainHeadId: "st-1",
            chainRunId: "run-1",
            principalId: "user-1",
            runStartedAt: "2026-08-17T23:00:00.000Z",
          },
        ],
        "st-1",
      ),
    ).toBe("run-1");
  });

  it("moves chain members out of producing and clears the open run", () => {
    const stop = {
      chainRunId: "run-1",
      chainHeadId: "st-1",
      memberIds: ["st-1", "st-2"],
      answers: [
        { documentId: "st-1", qty: 1 },
        { documentId: "st-2", qty: 1 },
      ],
    };
    const next = applyOptimisticChainStopToSubTasks(
      [
        stub({
          documentId: "st-1",
          status: "producing",
          startedAt: "2026-08-17T23:00:00.000Z",
          sharingType: "qty",
          targetQty: 1,
        }),
        stub({
          documentId: "st-2",
          status: "producing",
          startedAt: "2026-08-17T23:00:00.000Z",
          sharingType: "qty",
          targetQty: 1,
        }),
      ],
      stop,
    );

    expect(next[0]).toMatchObject({
      status: "finished",
      startedAt: null,
      completedQty: 1,
    });
    expect(next[1]).toMatchObject({
      status: "finished",
      startedAt: null,
      completedQty: 1,
    });
    expect(
      applyOptimisticChainStopToOpenRuns(
        [
          {
            chainHeadId: "st-1",
            chainRunId: "run-1",
            principalId: "user-1",
            runStartedAt: "2026-08-17T23:00:00.000Z",
          },
        ],
        stop,
      ),
    ).toEqual([]);
  });

  it("moves a started card into producingUnits before the server refresh", () => {
    const startedAt = "2026-08-17T23:00:00.000Z";
    const waiting = stub();
    const producing = applyOptimisticKioskStartToSubTasks([waiting], {
      documentId: "st-1",
      startedAt,
      mode: "solo",
    })[0]!;
    const next = applyOptimisticStateToLiberadasSection(
      {
        producingUnits: [],
        units: [
          {
            type: "isolated",
            subTask: waiting,
            helperMode: false,
            showStart: true,
          },
        ],
      },
      producing ? [producing] : [],
      [],
      "user-1",
      0,
      producing ? [producing] : [],
      {
        documentId: "st-1",
        startedAt,
        mode: "solo",
      },
    );

    expect(next.producingUnits).toHaveLength(1);
    expect(next.producingUnits[0]).toMatchObject({
      type: "isolated",
      showStart: false,
      hideActions: true,
      subTask: {
        documentId: "st-1",
        status: "producing",
        startedAt,
      },
    });
    expect(next.units).toHaveLength(0);
  });

  it("dedupes a group present in both producing and pending lists", () => {
    const groupUnit = {
      type: "group" as const,
      headId: "st-1",
      memberIds: ["st-1", "st-2"],
      members: [
        stub({ documentId: "st-1", status: "waiting" }),
        stub({ documentId: "st-2", name: "Embalar", index: 1 }),
      ],
      locked: false,
      principalActive: false,
      chainRunId: null,
      runStartedAt: null,
      showStart: true,
    };
    const next = applyOptimisticStateToLiberadasSection(
      {
        producingUnits: [groupUnit],
        units: [groupUnit],
      },
      groupUnit.members,
      [],
      "user-1",
    );

    expect([...next.producingUnits, ...next.units]).toHaveLength(1);
  });

  it("grants start on an occupied peer card and the next empty waiting card", () => {
    const producing = stub({
      documentId: "st-1",
      status: "producing",
      startedAt: null,
      activeWorkerCount: 1,
      maxSameTimeWorkers: 2,
    });
    const waiting = stub({
      documentId: "st-2",
      name: "Embalar",
      index: 1,
    });
    const next = applyOptimisticStateToLiberadasSection(
      {
        producingUnits: [
          {
            type: "isolated",
            subTask: producing,
            helperMode: false,
            showStart: true,
          },
        ],
        units: [
          {
            type: "isolated",
            subTask: waiting,
            helperMode: false,
            showStart: true,
          },
        ],
      },
      [producing, waiting],
      [],
      "user-1",
    );

    expect(next.producingUnits).toHaveLength(0);
    expect(
      next.units.map((unit) =>
        unit.type === "isolated"
          ? { id: unit.subTask.documentId, showStart: unit.showStart }
          : null,
      ),
    ).toEqual([
      { id: "st-1", showStart: true },
      { id: "st-2", showStart: true },
    ]);
  });

  it("settles chain stop when server queue no longer has the open run", () => {
    const stop = {
      chainRunId: "run-1",
      chainHeadId: "st-1",
      memberIds: ["st-1"],
      answers: [{ documentId: "st-1", completed: true }],
    };
    expect(
      isOptimisticChainStopSettled(
        [stub({ documentId: "st-1", status: "waiting" })],
        [],
        stop,
      ),
    ).toBe(true);
    expect(
      isOptimisticChainStopSettled(
        [stub({ documentId: "st-1", status: "producing" })],
        [],
        stop,
      ),
    ).toBe(false);
  });
});