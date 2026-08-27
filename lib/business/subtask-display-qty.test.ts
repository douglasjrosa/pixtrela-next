import { describe, expect, it } from "vitest";

import { calculateSubTaskDisplayQty } from "./subtask-display-qty";

describe("calculateSubTaskDisplayQty", () => {
  it("returns the stored sub-task qty without multiplying by task qty", () => {
    expect(calculateSubTaskDisplayQty(2, 10)).toBe(2);
  });

  it("returns sub-task qty when parent task qty is 1", () => {
    expect(calculateSubTaskDisplayQty(3, 1)).toBe(3);
  });
});
