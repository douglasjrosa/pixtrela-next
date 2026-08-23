import { describe, expect, it } from "vitest";

import { buildStoreCatalogHref } from "./store-filter-chips";

describe("buildStoreCatalogHref", () => {
  it("omits default filter and sort", () => {
    expect(buildStoreCatalogHref("/col-1/store", "all", "priceAsc")).toBe(
      "/col-1/store",
    );
  });

  it("preserves filter when changing sort", () => {
    expect(
      buildStoreCatalogHref("/col-1/store", "affordable", "priceDesc"),
    ).toBe("/col-1/store?filter=affordable&sort=priceDesc");
    expect(
      buildStoreCatalogHref("/col-1/store", "affordable", "priceAsc"),
    ).toBe("/col-1/store?filter=affordable");
  });

  it("preserves sort when changing filter", () => {
    expect(buildStoreCatalogHref("/col-1/store", "almost", "priceDesc")).toBe(
      "/col-1/store?filter=almost&sort=priceDesc",
    );
  });
});
