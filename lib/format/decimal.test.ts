import { describe, expect, it } from "vitest";

import {
  decimalPlacesFromStep,
  formatDecimalPtBr,
  formatSteppedNumber,
  roundDecimal,
} from "./decimal";

describe("decimalPlacesFromStep", () => {
  it("reads places from decimal steps", () => {
    expect(decimalPlacesFromStep("0.01")).toBe(2);
    expect(decimalPlacesFromStep(0.1)).toBe(1);
    expect(decimalPlacesFromStep(1)).toBe(0);
    expect(decimalPlacesFromStep("any")).toBe(2);
  });
});

describe("roundDecimal", () => {
  it("rounds binary float noise to two places", () => {
    expect(roundDecimal(10.099999999999)).toBe(10.1);
    expect(roundDecimal(1.235)).toBe(1.24);
    expect(roundDecimal(2, 0)).toBe(2);
  });
});

describe("formatSteppedNumber", () => {
  it("keeps two decimal digits for 0.01 steps", () => {
    expect(formatSteppedNumber(10.099999999999, 2)).toBe("10.10");
  });
});

describe("formatDecimalPtBr", () => {
  it("formats rounded values for display", () => {
    expect(formatDecimalPtBr(10.099999999999)).toBe("10,10");
  });
});
