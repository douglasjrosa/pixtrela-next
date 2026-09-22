import { and, asc, desc, eq, gte, lt } from "drizzle-orm";

import { balances } from "@/drizzle/schema";
import {
  applyOutcome,
  adjustIncome,
  buildNewMonthlyBalance,
  cascadeBalanceRows,
  firstDayOfMonth,
  recomputeBalance,
} from "@/lib/domain/balance";
import { getDb, type Db } from "@/lib/db/client";

export type BalanceRecord = {
  id: string;
  userId: string;
  currencyPluralTitle: string;
  date: string;
  previousBalance: number;
  totalIncome: number;
  totalOutcome: number;
  balance: number;
};

export async function getOrCreateMonthlyBalance(
  input: { userId: string; currencyPluralTitle: string; now?: Date },
  db: Db = getDb(),
): Promise<BalanceRecord> {
  const now = input.now ?? new Date();
  const monthDate = firstDayOfMonth(now);
  const currencyPluralTitle = input.currencyPluralTitle.trim();
  if (!currencyPluralTitle) throw new Error("currencyPluralTitleRequired");

  const [existing] = await db
    .select()
    .from(balances)
    .where(
      and(
        eq(balances.userId, input.userId),
        eq(balances.currencyPluralTitle, currencyPluralTitle),
        eq(balances.date, monthDate),
      ),
    )
    .limit(1);

  if (existing) {
    return {
      id: existing.id,
      userId: existing.userId,
      currencyPluralTitle: existing.currencyPluralTitle,
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
        eq(balances.currencyPluralTitle, currencyPluralTitle),
      ),
    )
    .orderBy(desc(balances.date))
    .limit(1);

  const payload = buildNewMonthlyBalance(now, previous?.balance ?? 0);
  const [created] = await db
    .insert(balances)
    .values({
      userId: input.userId,
      currencyPluralTitle,
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
    currencyPluralTitle: created.currencyPluralTitle,
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
    currencyPluralTitle: updated.currencyPluralTitle,
    date: updated.date,
    previousBalance: updated.previousBalance,
    totalIncome: updated.totalIncome,
    totalOutcome: updated.totalOutcome,
    balance: updated.balance,
  };
}

export async function adjustBalanceIncome(
  input: { balanceId: string; delta: number },
  db: Db = getDb(),
): Promise<BalanceRecord> {
  const [current] = await db
    .select()
    .from(balances)
    .where(eq(balances.id, input.balanceId))
    .limit(1);
  if (!current) throw new Error("balanceNotFound");

  const adjusted = adjustIncome(
    {
      previousBalance: current.previousBalance,
      totalIncome: current.totalIncome,
      totalOutcome: current.totalOutcome,
    },
    input.delta,
  );
  const balance = recomputeBalance(adjusted);

  const [updated] = await db
    .update(balances)
    .set({
      totalIncome: adjusted.totalIncome,
      balance,
      updatedAt: new Date(),
    })
    .where(eq(balances.id, input.balanceId))
    .returning();

  return {
    id: updated.id,
    userId: updated.userId,
    currencyPluralTitle: updated.currencyPluralTitle,
    date: updated.date,
    previousBalance: updated.previousBalance,
    totalIncome: updated.totalIncome,
    totalOutcome: updated.totalOutcome,
    balance: updated.balance,
  };
}

function balanceMonthKey(value: Date | string): string {
  if (value instanceof Date) return firstDayOfMonth(value);
  return firstDayOfMonth(new Date(`${value.slice(0, 10)}T00:00:00.000Z`));
}

export async function cascadeMonthlyBalances(
  input: {
    userId: string;
    currencyPluralTitle: string;
    from: Date;
  },
  db: Db = getDb(),
): Promise<void> {
  const fromMonth = firstDayOfMonth(input.from);
  const currencyPluralTitle = input.currencyPluralTitle.trim();
  const laterRows = await db
    .select()
    .from(balances)
    .where(
      and(
        eq(balances.userId, input.userId),
        eq(balances.currencyPluralTitle, currencyPluralTitle),
        gte(balances.date, fromMonth),
      ),
    )
    .orderBy(asc(balances.date));
  if (laterRows.length === 0) return;

  const [seed] = await db
    .select({ balance: balances.balance })
    .from(balances)
    .where(
      and(
        eq(balances.userId, input.userId),
        eq(balances.currencyPluralTitle, currencyPluralTitle),
        lt(balances.date, fromMonth),
      ),
    )
    .orderBy(desc(balances.date))
    .limit(1);

  const cascaded = cascadeBalanceRows(
    laterRows.map((row) => ({
      date: balanceMonthKey(row.date),
      totalIncome: row.totalIncome,
      totalOutcome: row.totalOutcome,
    })),
    seed?.balance ?? 0,
  );

  for (const next of cascaded) {
    const current = laterRows.find(
      (row) => balanceMonthKey(row.date) === next.date,
    );
    if (!current) continue;
    if (
      current.previousBalance === next.previousBalance &&
      current.balance === next.balance
    ) {
      continue;
    }
    await db
      .update(balances)
      .set({
        previousBalance: next.previousBalance,
        balance: next.balance,
        updatedAt: new Date(),
      })
      .where(eq(balances.id, current.id));
  }
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
    currencyPluralTitle: updated.currencyPluralTitle,
    date: updated.date,
    previousBalance: updated.previousBalance,
    totalIncome: updated.totalIncome,
    totalOutcome: updated.totalOutcome,
    balance: updated.balance,
  };
}
