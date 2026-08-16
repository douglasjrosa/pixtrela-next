/**
 * Pure monthly Balance rules (canonical domain — no framework I/O).
 */

export interface BalanceAmounts {
  previousBalance: number;
  totalIncome: number;
  totalOutcome: number;
}

export interface NewMonthlyBalance extends BalanceAmounts {
  date: string;
  balance: number;
}

export function firstDayOfMonth(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function recomputeBalance(amounts: BalanceAmounts): number {
  return amounts.previousBalance + amounts.totalIncome - amounts.totalOutcome;
}

/** Adjusts income by a signed delta without going below zero. */
export function adjustIncome(
  amounts: BalanceAmounts,
  delta: number,
): BalanceAmounts {
  const totalIncome = Math.max(0, amounts.totalIncome + delta);
  return { ...amounts, totalIncome };
}

export function buildNewMonthlyBalance(
  date: Date,
  previousBalance: number,
): NewMonthlyBalance {
  const amounts: BalanceAmounts = {
    previousBalance,
    totalIncome: 0,
    totalOutcome: 0,
  };
  return {
    date: firstDayOfMonth(date),
    ...amounts,
    balance: recomputeBalance(amounts),
  };
}

export function applyIncome(
  amounts: BalanceAmounts,
  income: number,
): BalanceAmounts {
  const totalIncome = amounts.totalIncome + Math.max(0, income);
  const next = { ...amounts, totalIncome };
  return { ...next, previousBalance: amounts.previousBalance };
}

export function applyOutcome(
  amounts: BalanceAmounts,
  outcome: number,
): BalanceAmounts & { balance: number } {
  const totalOutcome = amounts.totalOutcome + Math.max(0, outcome);
  const next = { ...amounts, totalOutcome };
  return { ...next, balance: recomputeBalance(next) };
}
