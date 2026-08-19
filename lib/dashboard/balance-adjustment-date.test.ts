import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getBalanceAdjustmentDateBounds,
  isBalanceAdjustmentDateInRange,
} from "./balance-adjustment-date";

describe("balance-adjustment-date", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows dates within the last 30 days including today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T12:00:00"));

    expect(isBalanceAdjustmentDateInRange("2026-08-18")).toBe(true);
    expect(isBalanceAdjustmentDateInRange("2026-07-19")).toBe(true);
    expect(isBalanceAdjustmentDateInRange("2026-07-18")).toBe(false);
    expect(isBalanceAdjustmentDateInRange("2026-08-19")).toBe(false);
  });

  it("exposes min and max bounds for native date inputs", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T12:00:00"));

    expect(getBalanceAdjustmentDateBounds()).toEqual({
      min: "2026-07-19",
      max: "2026-08-18",
    });
  });
});
