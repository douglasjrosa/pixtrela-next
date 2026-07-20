import { describe, expect, it } from "vitest";

import { daysUntilExchangeWindow } from "./exchange-window-days";

describe("daysUntilExchangeWindow", () => {
  it("returns 0 when today is inside the window", () => {
    expect(daysUntilExchangeWindow(3, 15, new Date(2026, 6, 10))).toBe(0);
  });

  it("returns days until first day when before the window", () => {
    expect(daysUntilExchangeWindow(3, 15, new Date(2026, 6, 1))).toBe(2);
  });

  it("returns days until next month first day when after the window", () => {
    expect(daysUntilExchangeWindow(3, 15, new Date(2026, 6, 20))).toBe(14);
  });
});
