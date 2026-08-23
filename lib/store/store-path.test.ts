import { describe, expect, it } from "vitest";

import {
  buildStoreCartPath,
  buildStoreOrderPath,
  buildStoreOrdersPath,
  buildStorePath,
  isUserStorePath,
} from "./store-path";

describe("store-path helpers", () => {
  const reserved = new Set(["board", "store"]);

  it("builds nested store paths", () => {
    expect(buildStorePath("col-1")).toBe("/col-1/store");
    expect(buildStoreCartPath("col-1")).toBe("/col-1/store/cart");
    expect(buildStoreOrdersPath("col-1")).toBe("/col-1/store/orders");
    expect(buildStoreOrderPath("col-1", "ord-1")).toBe(
      "/col-1/store/orders/ord-1",
    );
  });

  it("detects nested store paths", () => {
    expect(isUserStorePath("/col-1/store", reserved)).toBe(true);
    expect(isUserStorePath("/col-1/store/cart", reserved)).toBe(true);
    expect(isUserStorePath("/col-1/store/orders", reserved)).toBe(true);
    expect(isUserStorePath("/col-1/store/orders/ord-1", reserved)).toBe(true);
    expect(isUserStorePath("/col-1/store/other", reserved)).toBe(false);
    expect(isUserStorePath("/board/store", reserved)).toBe(false);
  });
});
