import { describe, expect, it } from "vitest";

import { formatAwardActualPrice } from "./award-cost-label";

describe("formatAwardActualPrice", () => {
  it("formats BRL currency for the awards list", () => {
    expect(formatAwardActualPrice(12.5)).toContain("12,50");
    expect(formatAwardActualPrice(12.5)).toMatch(/^R\$\s?12,50$/);
    expect(formatAwardActualPrice(0)).toMatch(/^R\$\s?0,00$/);
    expect(formatAwardActualPrice(10.099999999999)).toMatch(/^R\$\s?10,10$/);
  });
});
