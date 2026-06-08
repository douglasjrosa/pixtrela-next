import { describe, expect, it } from "vitest";

import { getNextTaskIndex } from "./task-order";

describe("getNextTaskIndex", () => {
  it("returns 0 for an empty list", () => {
    expect(getNextTaskIndex([])).toBe(0);
  });

  it("returns max index plus one", () => {
    expect(getNextTaskIndex([{ index: 0 }, { index: 3 }, { index: 1 }])).toBe(4);
  });
});
