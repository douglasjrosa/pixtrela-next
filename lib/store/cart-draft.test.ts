import { describe, expect, it } from "vitest";

import {
  clampAwardCurrencyQty,
  isCartDraftDirty,
  maxQtyForCurrency,
  serializeCartDraftPayload,
  setAwardCurrencyQty,
  type CartDraftAward,
} from "./cart-draft";

const AWARD: CartDraftAward = {
  awardId: "11111111-1111-4111-8111-111111111111",
  title: "Estrela",
  stock: 5,
  imageSrc: null,
  prices: [
    {
      currencyId: "22222222-2222-4222-8222-222222222222",
      label: "Estrelas",
      iconUrl: null,
      unitCost: 100,
      qty: 2,
    },
    {
      currencyId: "33333333-3333-4333-8333-333333333333",
      label: "Gemas",
      iconUrl: null,
      unitCost: 50,
      qty: 1,
    },
  ],
};

describe("cart-draft helpers", () => {
  it("limits qty by remaining stock across currencies and remaining balance", () => {
    expect(
      maxQtyForCurrency([AWARD], AWARD.awardId, AWARD.prices[0]!.currencyId, 400),
    ).toBe(4);
    expect(
      clampAwardCurrencyQty(
        [AWARD],
        AWARD.awardId,
        AWARD.prices[1]!.currencyId,
        9,
        150,
      ),
    ).toBe(3);
  });

  it("detects dirty drafts by award plus currency qty", () => {
    expect(isCartDraftDirty([AWARD], [AWARD])).toBe(false);
    expect(
      isCartDraftDirty(
        [AWARD],
        setAwardCurrencyQty(
          [AWARD],
          AWARD.awardId,
          AWARD.prices[0]!.currencyId,
          1,
          1000,
        ),
      ),
    ).toBe(true);
  });

  it("serializes every award currency pair", () => {
    const parsed = JSON.parse(serializeCartDraftPayload([AWARD])) as {
      items: Array<{ awardId: string; currencyId: string; qty: number }>;
    };
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]).toEqual({
      awardId: AWARD.awardId,
      currencyId: AWARD.prices[0]!.currencyId,
      qty: 2,
    });
  });
});
