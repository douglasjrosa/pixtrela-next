import { describe, expect, it } from "vitest";

import { isOverExpected, resolveProgressPercent } from "./subtask-progress";

describe("resolveProgressPercent", () => {
  it("returns zero when expected time is missing", () => {
    expect(resolveProgressPercent(120, 0)).toBe(0);
  });

  it("caps at one hundred percent", () => {
    expect(resolveProgressPercent(200, 100)).toBe(100);
  });

  it("returns proportional progress below expected time", () => {
    expect(resolveProgressPercent(50, 100)).toBe(50);
  });
});

describe("isOverExpected", () => {
  it("detects elapsed time above expected", () => {
    expect(isOverExpected(101, 100)).toBe(true);
    expect(isOverExpected(100, 100)).toBe(false);
    expect(isOverExpected(10, 0)).toBe(false);
  });
});
