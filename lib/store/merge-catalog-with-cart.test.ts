import { describe, expect, it } from "vitest";

import { mergeCatalogWithCart } from "./merge-catalog-with-cart";

const currencies = [
  {
    currencyId: "star",
    title: "Estrela",
    pluralTitle: "Estrelas",
    iconUrl: "/star.png",
    balance: 100,
  },
  {
    currencyId: "gem",
    title: "Gema",
    pluralTitle: "Gemas",
    iconUrl: null,
    balance: 50,
  },
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

  it("sorts awards by lowest price ascending", () => {
    const cards = mergeCatalogWithCart(
      [
        {
          awardId: "expensive",
          title: "Abacaxi",
          stock: 1,
          imageUrl: null,
          currencyId: "star",
          unitCost: 100,
          currencyActive: true,
          currencyShowInStore: true,
        },
        {
          awardId: "cheap",
          title: "Zebra",
          stock: 1,
          imageUrl: null,
          currencyId: "star",
          unitCost: 10,
          currencyActive: true,
          currencyShowInStore: true,
        },
        {
          awardId: "mid",
          title: "Banana",
          stock: 1,
          imageUrl: null,
          currencyId: "star",
          unitCost: 50,
          currencyActive: true,
          currencyShowInStore: true,
        },
      ],
      currencies,
      [],
    );

    expect(cards.map((card) => card.awardId)).toEqual([
      "cheap",
      "mid",
      "expensive",
    ]);
  });

  it("uses the lowest available currency price when sorting multi-currency awards", () => {
    const cards = mergeCatalogWithCart(
      [
        {
          awardId: "a",
          title: "Prêmio A",
          stock: 1,
          imageUrl: null,
          currencyId: "star",
          unitCost: 80,
          currencyActive: true,
          currencyShowInStore: true,
        },
        {
          awardId: "a",
          title: "Prêmio A",
          stock: 1,
          imageUrl: null,
          currencyId: "gem",
          unitCost: 25,
          currencyActive: true,
          currencyShowInStore: true,
        },
        {
          awardId: "b",
          title: "Prêmio B",
          stock: 1,
          imageUrl: null,
          currencyId: "star",
          unitCost: 40,
          currencyActive: true,
          currencyShowInStore: true,
        },
      ],
      currencies,
      [],
    );

    expect(cards.map((card) => card.awardId)).toEqual(["a", "b"]);
    expect(cards[0]?.prices.map((price) => price.unitCost)).toEqual([80, 25]);
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
