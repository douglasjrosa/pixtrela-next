import { describe, expect, it } from "vitest";

import {
  filterAndSortStoreAwards,
  parseStoreFilter,
  parseStoreSort,
  pickFeaturedAwards,
  type StoreAwardView,
} from "./load-store-page";
import { buildStorePath, isUserStorePath } from "./store-path";

function award(
  partial: Partial<StoreAwardView> & Pick<StoreAwardView, "id" | "cost" | "stock">,
): StoreAwardView {
  return {
    title: partial.title ?? partial.id,
    currencyId: "cur-1",
    currencyLabel: "Estrelas",
    ...partial,
  };
}

describe("store-path", () => {
  it("builds and detects store paths", () => {
    expect(buildStorePath("col-1")).toBe("/col-1/store");
    expect(isUserStorePath("/col-1/store", new Set(["board"]))).toBe(true);
    expect(isUserStorePath("/board/store", new Set(["board"]))).toBe(false);
  });
});

describe("parseStoreFilter / parseStoreSort", () => {
  it("parses known values and defaults", () => {
    expect(parseStoreFilter("affordable")).toBe("affordable");
    expect(parseStoreFilter("nope")).toBe("all");
    expect(parseStoreSort("priceDesc")).toBe("priceDesc");
    expect(parseStoreSort(undefined)).toBe("priceAsc");
  });
});

describe("filterAndSortStoreAwards", () => {
  const catalog = [
    award({ id: "a", cost: 100, stock: 3 }),
    award({ id: "b", cost: 50, stock: 10 }),
    award({ id: "c", cost: 200, stock: 0 }),
    award({ id: "d", cost: 80, stock: 2 }),
  ];

  it("filters affordable in-stock awards", () => {
    const result = filterAndSortStoreAwards(catalog, 90, "affordable", "priceAsc");
    expect(result.map((row) => row.id)).toEqual(["b", "d"]);
  });

  it("filters almost-there awards", () => {
    const result = filterAndSortStoreAwards(catalog, 75, "almost", "priceAsc");
    expect(result.map((row) => row.id)).toEqual(["d", "a"]);
  });

  it("filters low stock and sorts by price", () => {
    const asc = filterAndSortStoreAwards(catalog, 0, "lowStock", "priceAsc");
    expect(asc.map((row) => row.id)).toEqual(["d", "a"]);
    const desc = filterAndSortStoreAwards(catalog, 0, "lowStock", "priceDesc");
    expect(desc.map((row) => row.id)).toEqual(["a", "d"]);
  });
});

describe("pickFeaturedAwards", () => {
  it("prefers low stock then lowest price", () => {
    const featured = pickFeaturedAwards(
      [
        award({ id: "cheap", cost: 10, stock: 20 }),
        award({ id: "urgent", cost: 40, stock: 1 }),
        award({ id: "gone", cost: 5, stock: 0 }),
      ],
      2,
    );
    expect(featured.map((row) => row.id)).toEqual(["urgent", "cheap"]);
  });
});
