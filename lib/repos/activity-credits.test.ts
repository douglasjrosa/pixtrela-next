import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrCreateMonthlyBalance = vi.fn();
const adjustBalanceIncome = vi.fn();

vi.mock("@/lib/repos/balances", () => ({
  getOrCreateMonthlyBalance: (...args: unknown[]) =>
    getOrCreateMonthlyBalance(...args),
  adjustBalanceIncome: (...args: unknown[]) => adjustBalanceIncome(...args),
}));

describe("applyActivityIncomeDelta", () => {
  beforeEach(() => {
    vi.resetModules();
    getOrCreateMonthlyBalance.mockReset();
    adjustBalanceIncome.mockReset();
  });

  it("reverses awarded income on archive", async () => {
    getOrCreateMonthlyBalance.mockResolvedValue({ id: "bal-1" });
    const { applyActivityIncomeDelta } = await import("./activity-credits");
    const db = {} as never;
    await applyActivityIncomeDelta(
      {
        colaboratorId: "user-1",
        timestamp: new Date("2026-09-21T18:32:00.000Z"),
        delta: -12,
        currencyPluralTitle: "Estrelas",
      },
      db,
    );
    expect(adjustBalanceIncome).toHaveBeenCalledWith(
      { balanceId: "bal-1", delta: -12 },
      db,
    );
  });

  it("skips a zero delta", async () => {
    const { applyActivityIncomeDelta } = await import("./activity-credits");
    await applyActivityIncomeDelta(
      {
        colaboratorId: "user-1",
        timestamp: new Date(),
        delta: 0,
        currencyPluralTitle: null,
      },
      {} as never,
    );
    expect(getOrCreateMonthlyBalance).not.toHaveBeenCalled();
  });

  it("refuses a nonzero delta without a payment currency", async () => {
    const { applyActivityIncomeDelta } = await import("./activity-credits");
    await expect(
      applyActivityIncomeDelta(
        {
          colaboratorId: "user-1",
          timestamp: new Date(),
          delta: 4,
          currencyPluralTitle: null,
        },
        {} as never,
      ),
    ).rejects.toThrow("currencyNotConfigured");
  });
});
