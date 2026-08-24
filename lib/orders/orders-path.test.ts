import { describe, expect, it } from "vitest";

import { buildOrderPath, buildOrdersPath, isUserOrdersPath } from "./orders-path";

describe("orders-path helpers", () => {
  const reserved = new Set(["board", "orders"]);

  it("builds order paths", () => {
    expect(buildOrdersPath("col-1")).toBe("/col-1/orders");
    expect(buildOrderPath("col-1", "ord-1")).toBe("/col-1/orders/ord-1");
  });

  it("detects collaborator order paths", () => {
    expect(isUserOrdersPath("/col-1/orders", reserved)).toBe(true);
    expect(isUserOrdersPath("/col-1/orders/ord-1", reserved)).toBe(true);
    expect(isUserOrdersPath("/col-1/store/orders", reserved)).toBe(false);
    expect(isUserOrdersPath("/board/orders", reserved)).toBe(false);
  });
});
