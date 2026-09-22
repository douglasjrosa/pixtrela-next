import { describe, expect, it } from "vitest";

import {
  applyOutcome,
  adjustIncome,
  buildNewMonthlyBalance,
  cascadeBalanceRows,
  firstDayOfMonth,
  recomputeBalance,
} from "./balance";

describe("balance domain", () => {
  it("formats first day of month in UTC", () => {
    expect(firstDayOfMonth(new Date("2026-08-09T15:00:00Z"))).toBe(
      "2026-08-01",
    );
  });

  it("builds a new monthly balance carrying previous closing", () => {
    const row = buildNewMonthlyBalance(new Date("2026-08-09T12:00:00Z"), 40);
    expect(row).toEqual({
      date: "2026-08-01",
      previousBalance: 40,
      totalIncome: 0,
      totalOutcome: 0,
      balance: 40,
    });
  });

  it("recomputes and applies outcome", () => {
    expect(
      recomputeBalance({
        previousBalance: 10,
        totalIncome: 5,
        totalOutcome: 3,
      }),
    ).toBe(12);
    expect(
      applyOutcome(
        { previousBalance: 10, totalIncome: 0, totalOutcome: 0 },
        4,
      ).balance,
    ).toBe(6);
  });

  it("adjusts income by a signed delta without going below zero", () => {
    expect(
      adjustIncome(
        { previousBalance: 10, totalIncome: 20, totalOutcome: 0 },
        -8,
      ).totalIncome,
    ).toBe(12);
    expect(
      adjustIncome(
        { previousBalance: 10, totalIncome: 5, totalOutcome: 0 },
        -9,
      ).totalIncome,
    ).toBe(0);
  });

  it("cascades previous_balance through later months of the same currency", () => {
    expect(
      cascadeBalanceRows(
        [
          { date: "2026-08-01", totalIncome: 20, totalOutcome: 5 },
          { date: "2026-09-01", totalIncome: 10, totalOutcome: 0 },
        ],
        40,
      ),
    ).toEqual([
      { date: "2026-08-01", previousBalance: 40, balance: 55 },
      { date: "2026-09-01", previousBalance: 55, balance: 65 },
    ]);
  });

  it("skips missing months instead of inventing balance rows", () => {
    expect(
      cascadeBalanceRows(
        [
          { date: "2026-08-01", totalIncome: 20, totalOutcome: 0 },
          { date: "2026-10-01", totalIncome: 5, totalOutcome: 0 },
        ],
        0,
      ),
    ).toEqual([
      { date: "2026-08-01", previousBalance: 0, balance: 20 },
      { date: "2026-10-01", previousBalance: 20, balance: 25 },
    ]);
  });
});
