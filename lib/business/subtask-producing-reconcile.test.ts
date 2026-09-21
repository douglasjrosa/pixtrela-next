import { describe, expect, it } from "vitest";

import {
  findSubTaskIdsNeedingProducingReconcile,
  isSubTaskActivelyProducing,
  selectRowsForProducingReconcile,
  selectRowsForQtyCompleteReconcile,
} from "./subtask-producing-reconcile";

describe("subtask-producing-reconcile", () => {
  it("finds waiting subtasks with open sessions", () => {
    const ids = findSubTaskIdsNeedingProducingReconcile(
      [
        { id: "a", status: "waiting", taskId: "task-1" },
        { id: "b", status: "paused", taskId: "task-1" },
        { id: "c", status: "finished", taskId: "task-1" },
      ],
      new Map([
        ["a", ["col-1"]],
        ["b", ["col-1"]],
        ["c", ["col-1"]],
      ]),
    );
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("skips producing rows even with open sessions", () => {
    const ids = findSubTaskIdsNeedingProducingReconcile(
      [{ id: "a", status: "producing", taskId: "task-1" }],
      new Map([["a", ["col-1"]]]),
    );
    expect(ids).toEqual([]);
  });

  it("treats startedAt as actively producing for display", () => {
    expect(
      isSubTaskActivelyProducing({ status: "waiting", startedAt: "2026-01-01" }),
    ).toBe(true);
    expect(isSubTaskActivelyProducing({ status: "waiting", startedAt: null })).toBe(
      false,
    );
  });

  it("scopes producing reconcile to open sessions and active workers", () => {
    const idle = { id: "idle", status: "waiting", taskId: "task-1" };
    const orphan = { id: "orphan", status: "paused", taskId: "task-1" };
    const peerActive = { id: "peer", status: "waiting", taskId: "task-2" };
    const scoped = selectRowsForProducingReconcile(
      [idle, orphan, peerActive],
      {
        openSessionIds: ["orphan"],
        activeColaboratorIdsBySubTaskId: new Map([["peer", ["col-2"]]]),
      },
    );
    expect(scoped.map((row) => row.id).sort()).toEqual(["orphan", "peer"]);
  });

  it("scopes qty complete reconcile to idle qty rows without active workers", () => {
    const idleQty = {
      id: "qty-idle",
      status: "paused",
      qty: 10,
      sharingType: "qty",
      taskId: "task-1",
    };
    const duration = {
      id: "dur",
      status: "paused",
      qty: 1,
      sharingType: "duration",
      taskId: "task-1",
    };
    const producingQty = {
      id: "qty-run",
      status: "paused",
      qty: 10,
      sharingType: "qty",
      taskId: "task-1",
    };
    const waitingIncomplete = {
      id: "qty-open",
      status: "waiting",
      qty: 10,
      sharingType: "qty",
      taskId: "task-1",
    };
    const scoped = selectRowsForQtyCompleteReconcile(
      [idleQty, duration, producingQty, waitingIncomplete],
      {
        completedQtyBySubTaskId: new Map([
          ["qty-idle", 10],
          ["qty-run", 10],
          ["qty-open", 3],
        ]),
        activeColaboratorIdsBySubTaskId: new Map([["qty-run", ["col-1"]]]),
      },
    );
    expect(scoped.map((row) => row.id)).toEqual(["qty-idle"]);
  });
});
