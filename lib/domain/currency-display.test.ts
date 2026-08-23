import { describe, expect, it } from "vitest";

import {
  resolveAwardHistoryTitle,
  resolveCurrencyPluralTitle,
  resolveCurrencyTitle,
} from "./currency-display";

describe("currency-display", () => {
  it("uses singular title for amount labels", () => {
    expect(
      resolveCurrencyTitle({
        name: "star",
        title: "Estrela",
        pluralTitle: "Estrelas",
      }),
    ).toBe("Estrela");
    expect(resolveCurrencyTitle({ name: "CloseCur-1787113106259" })).toBe(
      "CloseCur-1787113106259",
    );
  });

  it("prefers plural title for balance and exchange labels", () => {
    expect(
      resolveCurrencyPluralTitle({
        name: "star",
        title: "Estrela",
        pluralTitle: "Estrelas",
      }),
    ).toBe("Estrelas");
  });

  it("falls back to title then name", () => {
    expect(
      resolveCurrencyPluralTitle({ name: "star", title: "Estrela" }),
    ).toBe("Estrela");
    expect(resolveCurrencyPluralTitle({ name: "star" })).toBe("star");
  });

  it("prefers award title over name for exchange history", () => {
    expect(
      resolveAwardHistoryTitle({ name: "arroz-sku", title: "Arroz 5kg" }),
    ).toBe("Arroz 5kg");
    expect(resolveAwardHistoryTitle({ name: "arroz-sku" })).toBe("arroz-sku");
  });
});
