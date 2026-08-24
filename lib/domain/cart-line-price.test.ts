import { describe, expect, it } from "vitest";

import { findCartLineAwardPrice } from "./cart-line-price";

describe("findCartLineAwardPrice", () => {
  const prices = [
    { awardId: "award-a", currencyId: "star", numberOf: 10 },
    { awardId: "award-a", currencyId: "gem", numberOf: 4 },
    { awardId: "award-a", currencyId: "coin", numberOf: 0 },
  ];

  it("uses the cart line currency and ignores the first price", () => {
    expect(findCartLineAwardPrice(prices, "award-a", "gem")).toEqual({
      awardId: "award-a",
      currencyId: "gem",
      numberOf: 4,
    });
  });

  it("returns null when the matching currency has no positive price", () => {
    expect(findCartLineAwardPrice(prices, "award-a", "coin")).toBeNull();
    expect(findCartLineAwardPrice(prices, "award-a", "missing")).toBeNull();
  });
});
