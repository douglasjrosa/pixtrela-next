import { describe, expect, it } from "vitest";

import { mergeCatalogWithCart } from "./merge-catalog-with-cart";

const currencies = [
  { currencyId: "star", label: "Estrelas", iconUrl: "/star.png", balance: 100 },
  { currencyId: "gem", label: "Gemas", iconUrl: null, balance: 50 },
];

describe("mergeCatalogWithCart", () => {
  it("hides zero prices and awards without a store price", () => {
    const cards = mergeCatalogWithCart(
      [
        {
          awardId: "a",
          title: "Amarela",
          stock: 3,
          imageUrl: null,
          currencyId: "star",
          unitCost: 10,
          currencyActive: true,
          currencyShowInStore: true,
        },
        {
          awardId: "a",
          title: "Amarela",
          stock: 3,
          imageUrl: null,
          currencyId: "gem",
          unitCost: 0,
          currencyActive: true,
          currencyShowInStore: true,
        },
        {
          awardId: "b",
          title: "Sem preco",
          stock: 1,
          imageUrl: null,
          currencyId: "star",
          unitCost: 0,
          currencyActive: true,
          currencyShowInStore: true,
        },
      ],
      currencies,
      [{ awardId: "a", currencyId: "star", qty: 2 }],
    );

    expect(cards).toEqual([
      {
        awardId: "a",
        title: "Amarela",
        stock: 3,
        imageUrl: null,
        prices: [
          {
            currencyId: "star",
            label: "Estrelas",
            iconUrl: "/star.png",
            unitCost: 10,
            qty: 2,
          },
        ],
      },
    ]);
  });

  it("keeps prices when store flags are omitted from a stale cache row", () => {
    const cards = mergeCatalogWithCart(
      [
        {
          awardId: "a",
          title: "Amarela",
          stock: 3,
          imageUrl: null,
          currencyId: "star",
          unitCost: 10,
          currencyActive: undefined as unknown as boolean,
          currencyShowInStore: undefined as unknown as boolean,
        },
      ],
      currencies,
      [],
    );
    expect(cards).toHaveLength(1);
  });

  it("hides inactive currencies even when show_in_store is true", () => {
    const cards = mergeCatalogWithCart(
      [
        {
          awardId: "a",
          title: "Amarela",
          stock: 3,
          imageUrl: null,
          currencyId: "star",
          unitCost: 10,
          currencyActive: false,
          currencyShowInStore: true,
        },
      ],
      currencies,
      [],
    );
    expect(cards).toEqual([]);
  });
});
