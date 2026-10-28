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
  const producingWithFlags = {
    status: "producing",
    hasAssignedFlags: true,
  };

  it("treats a producing predecessor with flags as satisfied when flags are on", () => {
    expect(isPredecessorSatisfied(producingWithFlags)).toBe(true);
    expect(isPredecessorSatisfied(producingWithFlags, true)).toBe(true);
  });

  it("ignores assigned flags when the feature is off", () => {
    expect(isPredecessorSatisfied(producingWithFlags, false)).toBe(false);
  });

  it("still treats a finished predecessor as satisfied when flags are off", () => {
    expect(
      isPredecessorSatisfied(
        { status: "finished", hasAssignedFlags: false },
        false,
      ),
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
