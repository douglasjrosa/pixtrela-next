import { describe, expect, it } from "vitest";

import {
  clampDraftQty,
  computeCartDraftTotal,
  isCartDraftDirty,
  mapCartDraftLines,
  serializeCartDraftPayload,
  type CartDraftItem,
} from "./cart-draft";

const BASE_ITEM: CartDraftItem = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Estrela",
  qty: 2,
  stock: 5,
  imageSrc: null,
  unitCost: 100,
};

describe("cart-draft helpers", () => {
  it("detects dirty drafts by qty changes and removals", () => {
    const baseline = [BASE_ITEM];
    expect(isCartDraftDirty(baseline, [{ ...BASE_ITEM, qty: 3 }])).toBe(true);
    expect(isCartDraftDirty(baseline, [{ ...BASE_ITEM, qty: 0 }])).toBe(true);
    expect(isCartDraftDirty(baseline, [])).toBe(true);
    expect(isCartDraftDirty(baseline, baseline)).toBe(false);
  });

  it("computes line totals and cart total from draft items", () => {
    const lines = mapCartDraftLines([
      BASE_ITEM,
      { ...BASE_ITEM, id: "22222222-2222-4222-8222-222222222222", qty: 1, unitCost: 50 },
    ]);
    expect(lines[0]?.lineCost).toBe(200);
    expect(computeCartDraftTotal(lines)).toBe(250);
  });

  it("serializes draft payload for server actions", () => {
    expect(serializeCartDraftPayload([BASE_ITEM])).toBe(
      JSON.stringify({
        items: [{ awardId: BASE_ITEM.id, qty: 2 }],
      }),
    );
  });

  it("clamps draft qty to stock bounds", () => {
    expect(clampDraftQty(0, 5)).toBe(0);
    expect(clampDraftQty(9, 5)).toBe(5);
    expect(clampDraftQty(3, 0)).toBe(0);
  });
});
