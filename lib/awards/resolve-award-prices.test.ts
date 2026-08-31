import { describe, expect, it, vi } from "vitest";

import {
  resolveAwardPrices,
  resolveAwardPricesOnSave,
} from "./resolve-award-prices";

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

describe("resolveAwardPricesOnSave", () => {
  it("returns manual prices when auto recalculate is disabled", async () => {
    const db = {
      select: vi.fn(),
    };

    const prices = await resolveAwardPricesOnSave(
      {
        autoRecalculate: false,
        actualPrice: 10,
        manualPrices: [{ currencyId: "cur-1", numberOf: 42 }],
      },
      db as never,
    );

    expect(prices).toEqual([{ currencyId: "cur-1", numberOf: 42 }]);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("loads exchange rates and recalculates all currencies", async () => {
    const where = vi.fn().mockResolvedValue([
      { id: "cur-1", exchangeRate: 0.5, active: true },
      { id: "cur-2", exchangeRate: 2, active: true },
    ]);
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    const db = { select };

    const prices = await resolveAwardPricesOnSave(
      {
        autoRecalculate: true,
        actualPrice: 12.5,
        manualPrices: [
          { currencyId: "cur-1", numberOf: 0 },
          { currencyId: "cur-2", numberOf: 0 },
        ],
      },
      db as never,
    );

    expect(prices).toEqual([
      { currencyId: "cur-1", numberOf: 625 },
      { currencyId: "cur-2", numberOf: 2500 },
    ]);
  });
});
