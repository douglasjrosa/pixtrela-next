import { describe, it, expect } from "vitest";
import {
  awardPricesFromValues,
  isExchangeWindowOpen,
  exchangeCost,
  canAfford,
} from "./exchange";

const team = { exchangesFirstDay: 5, exchangesLastDay: 15 };

describe("isExchangeWindowOpen", () => {
  it("is open inside the window", () => {
    expect(isExchangeWindowOpen(team, new Date("2026-06-10T00:00:00Z"))).toBe(true);
  });

  it("is closed before the window", () => {
    expect(isExchangeWindowOpen(team, new Date("2026-06-04T00:00:00Z"))).toBe(false);
  });

  it("is closed after the window", () => {
    expect(isExchangeWindowOpen(team, new Date("2026-06-16T00:00:00Z"))).toBe(false);
  });
});

describe("awardPricesFromValues", () => {
  it("maps Value component rows", () => {
    expect(
      awardPricesFromValues([{ currency: { name: "star" }, numberOf: 50 }]),
    ).toEqual([{ currency: "star", qty: 50 }]);
  });
});

describe("exchangeCost", () => {
  const priceTable = [{ currency: "star", qty: 100 }];

  it("multiplies unit price by quantity", () => {
    expect(exchangeCost(priceTable, "star", 2)).toBe(200);
  });

  it("returns 0 for unknown currency", () => {
    expect(exchangeCost(priceTable, "gem", 2)).toBe(0);
  });
});

describe("canAfford", () => {
  it("allows when balance covers cost", () => {
    expect(canAfford(200, 200)).toBe(true);
  });

  it("rejects when insufficient", () => {
    expect(canAfford(150, 200)).toBe(false);
  });

  it("rejects zero or negative cost", () => {
    expect(canAfford(100, 0)).toBe(false);
  });
});

describe("awardPricesFromValues edge cases", () => {
  it("returns empty for null or missing currency", () => {
    expect(awardPricesFromValues(null)).toEqual([]);
    expect(awardPricesFromValues([{ numberOf: 10 }])).toEqual([]);
  });

  it("clamps negative numberOf to zero", () => {
    expect(
      awardPricesFromValues([{ currency: { name: "star" }, numberOf: -5 }]),
    ).toEqual([{ currency: "star", qty: 0 }]);
  });
});

describe("isExchangeWindowOpen boundary days", () => {
  it("is open on first and last day of window", () => {
    expect(isExchangeWindowOpen(team, new Date("2026-06-05T00:00:00Z"))).toBe(true);
    expect(isExchangeWindowOpen(team, new Date("2026-06-15T00:00:00Z"))).toBe(true);
  });
});
