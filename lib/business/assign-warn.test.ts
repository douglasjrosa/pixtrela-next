import { describe, expect, it } from "vitest";

import {
  adjustAssignedCount,
  countAssignedSubTasksByColaborator,
  shouldShowAssignWarn,
} from "./assign-warn";

describe("countAssignedSubTasksByColaborator", () => {
  it("aggregates assignment counts per colaborator", () => {
    expect(
      countAssignedSubTasksByColaborator([
        { assignedToIds: ["u-1", "u-2"] },
        { assignedToIds: ["u-1"] },
        { assignedToIds: [] },
      ]),
    ).toEqual({ "u-1": 2, "u-2": 1 });
  });
});

describe("shouldShowAssignWarn", () => {
  it("shows only when count is between 1 and assignWarnMax inclusive", () => {
    expect(shouldShowAssignWarn(0, 4)).toBe(false);
    expect(shouldShowAssignWarn(1, 4)).toBe(true);
    expect(shouldShowAssignWarn(3, 4)).toBe(true);
    expect(shouldShowAssignWarn(4, 4)).toBe(true);
    expect(shouldShowAssignWarn(5, 4)).toBe(false);
  });

  it("never shows when assignWarnMax is 0", () => {
    expect(shouldShowAssignWarn(1, 0)).toBe(false);
    expect(shouldShowAssignWarn(0, 0)).toBe(false);
  });
});

describe("adjustAssignedCount", () => {
  it("increments and removes zero entries", () => {
    expect(adjustAssignedCount({ "u-1": 1 }, "u-1", 1)).toEqual({ "u-1": 2 });
    expect(adjustAssignedCount({ "u-1": 1 }, "u-1", -1)).toEqual({});
    expect(adjustAssignedCount({}, "u-2", 1)).toEqual({ "u-2": 1 });
  });
});
