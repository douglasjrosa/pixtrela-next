import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findUserById = vi.fn();
const findCurrencyById = vi.fn();
const getOrCreateMonthlyBalance = vi.fn();
const adjustBalanceIncome = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => auth(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/repos/users", () => ({
  findUserById: (...args: unknown[]) => findUserById(...args),
}));

vi.mock("@/lib/repos/awards", () => ({
  findCurrencyById: (...args: unknown[]) => findCurrencyById(...args),
}));

vi.mock("@/lib/repos/balances", () => ({
  getOrCreateMonthlyBalance: (...args: unknown[]) =>
    getOrCreateMonthlyBalance(...args),
  adjustBalanceIncome: (...args: unknown[]) => adjustBalanceIncome(...args),
}));

describe("adjustColaboratorBalance", () => {
  beforeEach(() => {
    vi.resetModules();
    auth.mockReset();
    findUserById.mockReset();
    findCurrencyById.mockReset();
    getOrCreateMonthlyBalance.mockReset();
    adjustBalanceIncome.mockReset();
    revalidatePath.mockReset();
  });

  it("adjusts balance for manager", async () => {
    auth.mockResolvedValue({ user: { role: "manager", id: "mgr-1" } });
    findUserById.mockResolvedValue({
      id: "col-1",
      role: "colaborator",
      active: true,
      blocked: false,
    });
    findCurrencyById.mockResolvedValue({
      id: "cur-1",
      name: "star",
      title: "Estrela",
      pluralTitle: "Estrelas",
    });
    getOrCreateMonthlyBalance.mockResolvedValue({ id: "bal-1" });
    adjustBalanceIncome.mockResolvedValue({ id: "bal-1" });

    const { adjustColaboratorBalance } = await import("./balance-adjustment-actions");
    const result = await adjustColaboratorBalance({
      colaboratorDocumentId: "00000000-0000-4000-8000-000000000001",
      date: "2026-08-15",
      currencyId: "00000000-0000-4000-8000-000000000002",
      amount: -5,
    });

    expect(result).toEqual({ ok: true });
    expect(adjustBalanceIncome).toHaveBeenCalledWith({
      balanceId: "bal-1",
      delta: -5,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("rejects leader", async () => {
    auth.mockResolvedValue({ user: { role: "leader", id: "lead-1" } });

    const { adjustColaboratorBalance } = await import("./balance-adjustment-actions");
    const result = await adjustColaboratorBalance({
      colaboratorDocumentId: "00000000-0000-4000-8000-000000000001",
      date: "2026-08-15",
      currencyId: "00000000-0000-4000-8000-000000000002",
      amount: 10,
    });

    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(adjustBalanceIncome).not.toHaveBeenCalled();
  });
});
