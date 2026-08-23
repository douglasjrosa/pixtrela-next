import { describe, expect, it } from "vitest";

import {
  exchangeCurrencyLabelForAmount,
  formatExchangeCurrencyAmount,
  formatExchangeCurrencyLabel,
} from "./exchange-currency";

const estrelas = { title: "Estrela", pluralTitle: "Estrelas" };

describe("formatExchangeCurrencyAmount", () => {
  it("formats values with pt-BR grouping", () => {
    expect(formatExchangeCurrencyAmount(15236)).toBe("15.236");
    expect(formatExchangeCurrencyAmount(4350)).toBe("4.350");
  });
});

describe("exchangeCurrencyLabelForAmount", () => {
  it("uses singular title for amount 1", () => {
    expect(exchangeCurrencyLabelForAmount(1, estrelas)).toBe("Estrela");
  });

  it("uses plural title for other amounts", () => {
    expect(exchangeCurrencyLabelForAmount(2, estrelas)).toBe("Estrelas");
    expect(exchangeCurrencyLabelForAmount(7618, estrelas)).toBe("Estrelas");
  });
});

describe("formatExchangeCurrencyLabel", () => {
  it("appends the correct currency label", () => {
    expect(formatExchangeCurrencyLabel(1, estrelas)).toBe("1 Estrela");
    expect(formatExchangeCurrencyLabel(7618, estrelas)).toBe("7.618 Estrelas");
  });
});
