import { describe, expect, it, vi } from "vitest";

import { resolveAwardPricesOnSave } from "./resolve-award-prices";

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

  it("recalculates only currencies with numberOf greater than zero", async () => {
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
          { currencyId: "cur-1", numberOf: 1 },
          { currencyId: "cur-2", numberOf: 0 },
        ],
      },
      db as never,
    );

    expect(prices).toEqual([
      { currencyId: "cur-1", numberOf: 625 },
      { currencyId: "cur-2", numberOf: 0 },
    ]);
  });
});
