import { describe, expect, it } from "vitest";

import { mergeCatalogWithCart } from "./merge-catalog-with-cart";

describe("mergeCatalogWithCart", () => {
  it("lists every catalog award and defaults missing cart qty to 0", () => {
    const lines = mergeCatalogWithCart(
      [
        { id: "b", title: "Azul", stock: 4, cost: 20, imageUrl: null },
        { id: "a", title: "Amarela", stock: 2, cost: 10, imageUrl: "/a.png" },
      ],
      [{ awardId: "a", qty: 3 }],
    );

    expect(lines).toEqual([
      {
        awardId: "a",
        title: "Amarela",
        qty: 3,
        stock: 2,
        imageUrl: "/a.png",
        unitCost: 10,
      },
      {
        awardId: "b",
        title: "Azul",
        qty: 0,
        stock: 4,
        imageUrl: null,
        unitCost: 20,
      },
    ]);
  });
});
