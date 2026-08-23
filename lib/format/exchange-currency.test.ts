import { describe, expect, it } from "vitest";

import {
  formatExchangeCurrencyAmount,
  formatExchangeCurrencyLabel,
} from "./exchange-currency";

describe("formatExchangeCurrencyAmount", () => {
  it("formats values with pt-BR grouping", () => {
    expect(formatExchangeCurrencyAmount(15236)).toBe("15.236");
    expect(formatExchangeCurrencyAmount(4350)).toBe("4.350");
  });
});

describe("formatExchangeCurrencyLabel", () => {
  it("appends the currency plural title", () => {
    expect(formatExchangeCurrencyLabel(7618, "Estrelas")).toBe(
      "7.618 Estrelas",
    );
  });
});
