import { describe, expect, it } from "vitest";

import {
  canAffordCart,
  cartItemCount,
  cartLineCost,
  cartTotal,
  clampCartQty,
} from "./cart";

describe("clampCartQty", () => {
  it("clamps to stock and rejects empty stock", () => {
    expect(clampCartQty(3, 2)).toBe(2);
    expect(clampCartQty(0, 5)).toBe(1);
    expect(clampCartQty(2, 0)).toBe(0);
  });
});

describe("cart totals", () => {
  it("computes line and cart totals", () => {
    expect(cartLineCost(10, 3)).toBe(30);
    expect(cartLineCost(0, 3)).toBe(0);
    expect(
      cartTotal([
        { unitCost: 10, qty: 2 },
        { unitCost: 5, qty: 1 },
      ]),
    ).toBe(25);
    expect(cartItemCount([{ qty: 2 }, { qty: 3 }])).toBe(5);
  });

  it("checks affordability", () => {
    expect(canAffordCart(100, 40)).toBe(true);
    expect(canAffordCart(10, 40)).toBe(false);
    expect(canAffordCart(40, 0)).toBe(false);
  });
});
