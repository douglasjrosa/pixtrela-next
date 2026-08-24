import { describe, expect, it } from "vitest";

import {
  formatCurrencyPerSecond,
  formatExchangeRate,
  roundCurrencyRate,
} from "./currency-rate";

describe("roundCurrencyRate", () => {
  it("rounds to two decimal places", () => {
    expect(roundCurrencyRate(1.234)).toBe(1.23);
    expect(roundCurrencyRate(1.235)).toBe(1.24);
    expect(roundCurrencyRate(2)).toBe(2);
  });

  it("returns zero for non-finite values", () => {
    expect(roundCurrencyRate(Number.NaN)).toBe(0);
    expect(roundCurrencyRate(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("formatCurrencyPerSecond", () => {
  it("formats values with pt-BR decimals", () => {
    expect(formatCurrencyPerSecond(2)).toBe("2,00");
    expect(formatCurrencyPerSecond(0.5)).toBe("0,50");
    expect(formatCurrencyPerSecond(1.234)).toBe("1,23");
  });
});

describe("formatExchangeRate", () => {
  it("limits binary float noise to two pt-BR decimals", () => {
    expect(formatExchangeRate(10.099999999999)).toBe("10,10");
  });
});
