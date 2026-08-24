import { describe, expect, it } from "vitest";

import {
  buildStorePath,
  COLABORATOR_STORE_PAGE_PATH,
  isUserStorePath,
} from "./store-path";

describe("store-path helpers", () => {
  const reserved = new Set(["board", "store"]);

  it("builds the store path", () => {
    expect(buildStorePath("col-1")).toBe("/col-1/store");
  });

  it("exposes the dynamic store path for cache revalidation", () => {
    expect(COLABORATOR_STORE_PAGE_PATH).toBe("/[documentId]/store");
  });

  it("detects only the store root path", () => {
    expect(isUserStorePath("/col-1/store", reserved)).toBe(true);
    expect(isUserStorePath("/col-1/store/orders", reserved)).toBe(false);
    expect(isUserStorePath("/col-1/store/cart", reserved)).toBe(false);
    expect(isUserStorePath("/board/store", reserved)).toBe(false);
  });
});
