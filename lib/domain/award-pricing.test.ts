import { describe, expect, it } from "vitest";

import { calculateAwardNumberOf } from "./award-pricing";

describe("calculateAwardNumberOf", () => {
  it("multiplies actual price in centavos by the exchange rate", () => {
    expect(calculateAwardNumberOf(12.5, 0.5)).toBe(625);
    expect(calculateAwardNumberOf(9.99, 2)).toBe(1998);
  });

  it("returns zero when price or rate is not positive", () => {
    expect(calculateAwardNumberOf(0, 1)).toBe(0);
    expect(calculateAwardNumberOf(10, 0)).toBe(0);
    expect(calculateAwardNumberOf(-1, 1)).toBe(0);
  });
});
