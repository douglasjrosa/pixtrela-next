import { and, desc, eq } from "drizzle-orm";

import { balances } from "@/drizzle/schema";
import {
  applyOutcome,
  buildNewMonthlyBalance,
  firstDayOfMonth,
  recomputeBalance,
} from "@/lib/domain/balance";
import { getDb, type Db } from "@/lib/db/client";

export type BalanceRecord = {
  id: string;
  userId: string;
  currencyId: string;
  date: string;
  previousBalance: number;
  totalIncome: number;
  totalOutcome: number;
  balance: number;
};

export async function getOrCreateMonthlyBalance(
  input: { userId: string; currencyId: string; now?: Date },
  db: Db = getDb(),
): Promise<BalanceRecord> {
  const now = input.now ?? new Date();
  const monthDate = firstDayOfMonth(now);

  const [existing] = await db
    .select()
    .from(balances)
    .where(
      and(
        eq(balances.userId, input.userId),
        eq(balances.currencyId, input.currencyId),
        eq(balances.date, monthDate),
      ),
    )
    .limit(1);

  if (existing) {
    return {
      id: existing.id,
      userId: existing.userId,
      currencyId: existing.currencyId,
      date: existing.date,
      previousBalance: existing.previousBalance,
      totalIncome: existing.totalIncome,
      totalOutcome: existing.totalOutcome,
      balance: existing.balance,
    };
  }

  const [previous] = await db
    .select()
    .from(balances)
    .where(
      and(
        eq(balances.userId, input.userId),
        eq(balances.currencyId, input.currencyId),
      ),
    )
    .orderBy(desc(balances.date))
    .limit(1);

  const payload = buildNewMonthlyBalance(now, previous?.balance ?? 0);
  const [created] = await db
    .insert(balances)
    .values({
      userId: input.userId,
      currencyId: input.currencyId,
      date: payload.date,
      previousBalance: payload.previousBalance,
      totalIncome: payload.totalIncome,
      totalOutcome: payload.totalOutcome,
      balance: payload.balance,
    })
    .returning();

  return {
    id: created.id,
    userId: created.userId,
    currencyId: created.currencyId,
    date: created.date,
    previousBalance: created.previousBalance,
    totalIncome: created.totalIncome,
    totalOutcome: created.totalOutcome,
    balance: created.balance,
  };
}

export async function creditBalanceIncome(
  input: { balanceId: string; amount: number },
  db: Db = getDb(),
): Promise<BalanceRecord> {
  const [current] = await db
    .select()
    .from(balances)
    .where(eq(balances.id, input.balanceId))
    .limit(1);
  if (!current) throw new Error("balanceNotFound");

  const totalIncome = current.totalIncome + Math.max(0, input.amount);
  const balance = recomputeBalance({
    previousBalance: current.previousBalance,
    totalIncome,
    totalOutcome: current.totalOutcome,
  });

  const [updated] = await db
    .update(balances)
    .set({ totalIncome, balance, updatedAt: new Date() })
    .where(eq(balances.id, input.balanceId))
    .returning();

  return {
    id: updated.id,
    userId: updated.userId,
    currencyId: updated.currencyId,
    date: updated.date,
    previousBalance: updated.previousBalance,
    totalIncome: updated.totalIncome,
    totalOutcome: updated.totalOutcome,
    balance: updated.balance,
  };
}

export async function debitBalanceOutcome(
  input: { balanceId: string; amount: number },
  db: Db = getDb(),
): Promise<BalanceRecord> {
  const [current] = await db
    .select()
    .from(balances)
    .where(eq(balances.id, input.balanceId))
    .limit(1);
  if (!current) throw new Error("balanceNotFound");

  const next = applyOutcome(
    {
      previousBalance: current.previousBalance,
      totalIncome: current.totalIncome,
      totalOutcome: current.totalOutcome,
    },
    input.amount,
  );

  if (next.balance < 0) throw new Error("insufficientBalance");

  const [updated] = await db
    .update(balances)
    .set({
      totalOutcome: next.totalOutcome,
      balance: next.balance,
      updatedAt: new Date(),
    })
    .where(eq(balances.id, input.balanceId))
    .returning();

  return {
    id: updated.id,
    userId: updated.userId,
    currencyId: updated.currencyId,
    date: updated.date,
    previousBalance: updated.previousBalance,
    totalIncome: updated.totalIncome,
    totalOutcome: updated.totalOutcome,
    balance: updated.balance,
  };
}
