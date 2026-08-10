import { describe, expect, it } from "vitest";

import {
  canAfford,
  exchangeCost,
  isExchangeWindowOpen,
} from "./exchange";

describe("exchange domain", () => {
  it("opens only inside the team window (UTC day)", () => {
    const team = { exchangesFirstDay: 3, exchangesLastDay: 15 };
    expect(isExchangeWindowOpen(team, new Date("2026-08-03T12:00:00Z"))).toBe(
      true,
    );
    expect(isExchangeWindowOpen(team, new Date("2026-08-02T12:00:00Z"))).toBe(
      false,
    );
  });

  it("computes cost and affordability", () => {
    const prices = [
      { currencyId: "c1", currencyName: "Estrela", qty: 10 },
    ];
    expect(exchangeCost(prices, "c1", 2)).toBe(20);
    expect(canAfford(20, 20)).toBe(true);
    expect(canAfford(19, 20)).toBe(false);
  });
});
