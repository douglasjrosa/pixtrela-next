import { describe, expect, it } from "vitest";

import {
  isPredecessorSatisfied,
  normalizeSubTaskDependencyIds,
  parseSubTaskDependencyIds,
} from "./subtask-dependencies";

describe("parseSubTaskDependencyIds", () => {
  it("reads dependency document ids from json", () => {
    expect(parseSubTaskDependencyIds(["doc-a", "doc-b"])).toEqual([
      "doc-a",
      "doc-b",
    ]);
  });

  it("returns empty array for legacy or invalid values", () => {
    expect(parseSubTaskDependencyIds(null)).toEqual([]);
    expect(parseSubTaskDependencyIds({ after: ["x"] })).toEqual([]);
  });
});

describe("isPredecessorSatisfied", () => {
  it("treats any non-waiting predecessor as satisfied", () => {
    expect(isPredecessorSatisfied({ status: "producing" })).toBe(true);
    expect(isPredecessorSatisfied({ status: "paused" })).toBe(true);
    expect(isPredecessorSatisfied({ status: "finished" })).toBe(true);
  });

  it("keeps a waiting predecessor unsatisfied even when flags are assigned", () => {
    expect(
      isPredecessorSatisfied({ status: "waiting", hasAssignedFlags: true }),
    ).toBe(false);
    expect(
      isPredecessorSatisfied(
        { status: "waiting", hasAssignedFlags: true },
        false,
      ),
    ).toBe(false);
  });

  it("ignores the flags toggle once a session has started", () => {
    expect(
      isPredecessorSatisfied({ status: "producing", hasAssignedFlags: false }, false),
    ).toBe(true);
    expect(
      isPredecessorSatisfied({ status: "paused", hasAssignedFlags: false }, true),
    ).toBe(true);
  });
});

describe("normalizeSubTaskDependencyIds", () => {
  it("removes duplicates and the current sub-task id", () => {
    expect(
      normalizeSubTaskDependencyIds(["a", "b", "a", "self"], "self"),
    ).toEqual(["a", "b"]);
  });
});
