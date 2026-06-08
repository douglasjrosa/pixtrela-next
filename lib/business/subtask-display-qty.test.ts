import { describe, expect, it } from "vitest";

import { calculateSubTaskDisplayQty } from "./subtask-display-qty";

describe("calculateSubTaskDisplayQty", () => {
  it("multiplies sub-task qty by parent task qty", () => {
    expect(calculateSubTaskDisplayQty(2, 10)).toBe(20);
  });

  it("returns sub-task qty when parent task qty is 1", () => {
    expect(calculateSubTaskDisplayQty(3, 1)).toBe(3);
  });
});
