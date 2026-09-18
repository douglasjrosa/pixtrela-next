import { describe, expect, it } from "vitest";

import {
  findSubTaskIdsNeedingProducingReconcile,
  isSubTaskActivelyProducing,
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
});
