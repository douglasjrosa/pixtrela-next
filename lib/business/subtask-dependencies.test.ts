import { describe, expect, it } from "vitest";

import {
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

describe("normalizeSubTaskDependencyIds", () => {
  it("removes duplicates and the current sub-task id", () => {
    expect(
      normalizeSubTaskDependencyIds(["a", "b", "a", "self"], "self"),
    ).toEqual(["a", "b"]);
  });
});
