import { describe, expect, it } from "vitest";

import {
  DEFAULT_ASSIGN_WARN_MAX,
  MAX_ASSIGN_WARN_MAX,
  MIN_ASSIGN_WARN_MAX,
  normalizeAssignWarnMax,
} from "./assign-warn-max";

describe("normalizeAssignWarnMax", () => {
  it("returns default for non-finite values", () => {
    expect(normalizeAssignWarnMax(Number.NaN)).toBe(DEFAULT_ASSIGN_WARN_MAX);
    expect(normalizeAssignWarnMax(Number.POSITIVE_INFINITY)).toBe(
      DEFAULT_ASSIGN_WARN_MAX,
    );
  });

  it("rounds and clamps to the allowed range", () => {
    expect(normalizeAssignWarnMax(3.6)).toBe(4);
    expect(normalizeAssignWarnMax(-2)).toBe(MIN_ASSIGN_WARN_MAX);
    expect(normalizeAssignWarnMax(250)).toBe(MAX_ASSIGN_WARN_MAX);
  });
});
