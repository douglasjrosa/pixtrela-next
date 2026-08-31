import { describe, expect, it } from "vitest";

import { listSavedCartItems } from "./list-saved-cart-items";

describe("listSavedCartItems", () => {
  it("returns only awards with saved qty", () => {
    expect(
      listSavedCartItems([
        {
          awardId: "a1",
          title: "Arroz",
          stock: 10,
          imageUrl: null,
          prices: [
            {
              currencyId: "c1",
              label: "Estrelas",
              iconUrl: null,
              unitCost: 100,
              qty: 2,
            },
          ],
        },
        {
          awardId: "a2",
          title: "Feijão",
          stock: 5,
          imageUrl: "/feijao.png",
          prices: [
            {
              currencyId: "c1",
              label: "Estrelas",
              iconUrl: null,
              unitCost: 50,
              qty: 0,
            },
          ],
        },
      ]),
    ).toEqual([
      {
        awardId: "a1",
        title: "Arroz",
        imageUrl: null,
        lines: [
          {
            currencyId: "c1",
            qty: 2,
            label: "Estrelas",
            unitCost: 100,
            iconUrl: null,
          },
        ],
      },
    ]);
  });
});
