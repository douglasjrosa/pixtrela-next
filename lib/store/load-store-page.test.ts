import { describe, expect, it } from "vitest";

import { buildStorePath, isUserStorePath } from "./store-path";

describe("store-path", () => {
  it("builds and detects store paths", () => {
    expect(buildStorePath("col-1")).toBe("/col-1/store");
    expect(isUserStorePath("/col-1/store", new Set(["board"]))).toBe(true);
    expect(isUserStorePath("/col-1/store/orders", new Set(["board"]))).toBe(
      true,
    );
    expect(isUserStorePath("/col-1/store/cart", new Set(["board"]))).toBe(
      false,
    );
    expect(isUserStorePath("/board/store", new Set(["board"]))).toBe(false);
  });
});
