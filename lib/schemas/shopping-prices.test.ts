import { describe, expect, it } from "vitest";

import { shoppingPriceUpdatesSchema } from "./shopping-prices";

describe("shoppingPriceUpdatesSchema", () => {
  it("accepts award price rows", () => {
    const parsed = shoppingPriceUpdatesSchema.parse({
      awards: [
        {
          awardId: "550e8400-e29b-41d4-a716-446655440000",
          actualPrice: 12.5,
        },
      ],
    });

    expect(parsed.awards[0]?.actualPrice).toBe(12.5);
  });

  it("rounds actualPrice to two decimals", () => {
    const parsed = shoppingPriceUpdatesSchema.parse({
      awards: [
        {
          awardId: "550e8400-e29b-41d4-a716-446655440000",
          actualPrice: 10.099999999999,
        },
      ],
    });
    expect(parsed.awards[0]?.actualPrice).toBe(10.1);
  });

  it("rejects empty award list", () => {
    expect(() =>
      shoppingPriceUpdatesSchema.parse({ awards: [] }),
    ).toThrow();
  });
});
