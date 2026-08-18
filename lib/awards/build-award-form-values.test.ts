import { describe, expect, it } from "vitest";

import { buildAwardValuesForCurrencies } from "./build-award-form-values";

describe("buildAwardValuesForCurrencies", () => {
  const currencies = [
    { documentId: "c1" },
    { documentId: "c2" },
  ];

  it("creates one default value per currency", () => {
    expect(buildAwardValuesForCurrencies(currencies)).toEqual([
      { currencyDocumentId: "c1", numberOf: 1 },
      { currencyDocumentId: "c2", numberOf: 1 },
    ]);
  });

  it("preserves zero as a disabled currency price", () => {
    expect(
      buildAwardValuesForCurrencies(currencies, [
        { currencyDocumentId: "c1", numberOf: 0 },
        { currencyDocumentId: "c2", numberOf: 7 },
      ]),
    ).toEqual([
      { currencyDocumentId: "c1", numberOf: 0 },
      { currencyDocumentId: "c2", numberOf: 7 },
    ]);
  });

  it("preserves saved values and fills missing currencies", () => {
    expect(
      buildAwardValuesForCurrencies(currencies, [
        { currencyDocumentId: "c2", numberOf: 7 },
      ]),
    ).toEqual([
      { currencyDocumentId: "c1", numberOf: 1 },
      { currencyDocumentId: "c2", numberOf: 7 },
    ]);
  });
});
