import { describe, expect, it, vi } from "vitest";

import { resolveAwardPrices } from "./resolve-award-prices";

describe("resolveAwardPrices", () => {
  it("returns manual prices when auto recalculate is disabled", () => {
    const prices = resolveAwardPrices({
      autoRecalculate: false,
      actualPrice: 10,
      manualPrices: [{ currencyId: "cur-1", numberOf: 42 }],
      exchangeRateById: { "cur-1": 0.5 },
    });

    expect(prices).toEqual([{ currencyId: "cur-1", numberOf: 42 }]);
  });

  it("recalculates every currency when auto recalculate is enabled", () => {
    const prices = resolveAwardPrices({
      autoRecalculate: true,
      actualPrice: 12.5,
      manualPrices: [
        { currencyId: "cur-1", numberOf: 0 },
        { currencyId: "cur-2", numberOf: 99 },
      ],
      exchangeRateById: {
        "cur-1": 0.5,
        "cur-2": 2,
      },
    });

    expect(prices).toEqual([
      { currencyId: "cur-1", numberOf: 625 },
      { currencyId: "cur-2", numberOf: 2500 },
    ]);
  });
});
