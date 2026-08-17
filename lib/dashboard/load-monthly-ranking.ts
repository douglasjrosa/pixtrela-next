import { and, asc, eq } from "drizzle-orm";

import { balances, currencies, users } from "@/drizzle/schema";
import { getDb } from "@/lib/db/client";
import { firstDayOfMonth } from "@/lib/domain/balance";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";

import type { MonthlyRankingData } from "./types";

const EMPTY_RANKING: MonthlyRankingData = {
  month: "",
  currencies: [],
};

/**
 * Simple monthly ranking from balances + currencies (all active colaborators).
 */
async function loadDrizzleMonthlyRanking(
  now: Date = new Date(),
): Promise<MonthlyRankingData> {
  const monthDate = firstDayOfMonth(now);
  const db = getDb();

  const currencyRows = await db
    .select({
      id: currencies.id,
      name: currencies.name,
      title: currencies.title,
      pluralTitle: currencies.pluralTitle,
    })
    .from(currencies)
    .orderBy(asc(currencies.name));

  if (currencyRows.length === 0) {
    return { month: monthDate, currencies: [] };
  }

  const colaborators = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(
      and(
        eq(users.role, "colaborator"),
        eq(users.active, true),
        eq(users.blocked, false),
      ),
    );

  const balanceRows = await db
    .select({
      userId: balances.userId,
      currencyPluralTitle: balances.currencyPluralTitle,
      totalIncome: balances.totalIncome,
    })
    .from(balances)
    .where(eq(balances.date, monthDate));

  const incomeByCurrencyUser = new Map<string, number>();
  for (const row of balanceRows) {
    incomeByCurrencyUser.set(
      `${row.currencyPluralTitle}:${row.userId}`,
      Number(row.totalIncome),
    );
  }

  return {
    month: monthDate,
    currencies: currencyRows.map((currency, index) => {
      const pluralTitle =
        currency.pluralTitle ?? currency.title ?? currency.name;
      const rows = colaborators
        .map((colaborator) => ({
          userDocumentId: colaborator.id,
          name: colaborator.name,
          totalIncome:
            incomeByCurrencyUser.get(`${pluralTitle}:${colaborator.id}`) ?? 0,
        }))
        .filter((row) => row.totalIncome > 0)
        .sort((a, b) => b.totalIncome - a.totalIncome)
        .map((row, rankIndex) => ({
          rank: rankIndex + 1,
          userDocumentId: row.userDocumentId,
          name: row.name,
          totalIncome: row.totalIncome,
        }));

      return {
        id: index + 1,
        name: currency.name,
        title: currency.title ?? currency.name,
        pluralTitle: currency.pluralTitle ?? currency.title ?? currency.name,
        rows,
      };
    }),
  };
}

export async function loadMonthlyRanking(): Promise<MonthlyRankingData> {
  try {
    return await loadDrizzleMonthlyRanking();
  } catch (error) {
    rethrowIfNavigationError(error);
    return EMPTY_RANKING;
  }
}
