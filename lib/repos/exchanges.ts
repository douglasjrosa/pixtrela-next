import { desc, eq } from "drizzle-orm";

import {
  awardPrices,
  awards,
  currencies,
  exchanges,
  teams,
  teamMembers,
} from "@/drizzle/schema";
import {
  resolveAwardHistoryTitle,
  resolveCurrencyPluralTitle,
} from "@/lib/domain/currency-display";
import {
  canAfford,
  exchangeCost,
  isExchangeWindowOpen,
  type AwardPrice,
} from "@/lib/domain/exchange";
import { getDb, type Db } from "@/lib/db/client";
import {
  debitBalanceOutcome,
  getOrCreateMonthlyBalance,
} from "@/lib/repos/balances";

export type RedeemAwardInput = {
  userId: string;
  awardId: string;
  currencyId: string;
  qty: number;
  now?: Date;
};

export type ExchangeHistoryRecord = {
  id: string;
  timestamp: Date;
  qty: number;
  awardTitle: string;
};

export async function loadAwardPrices(
  awardId: string,
  db: Db = getDb(),
): Promise<AwardPrice[]> {
  const rows = await db
    .select({
      currencyId: awardPrices.currencyId,
      numberOf: awardPrices.numberOf,
    })
    .from(awardPrices)
    .where(eq(awardPrices.awardId, awardId));

  return rows.map((row) => ({
    currencyId: row.currencyId,
    currencyName: row.currencyId,
    qty: row.numberOf,
  }));
}

async function findTeamWindowForUser(
  userId: string,
  db: Db,
): Promise<{ exchangesFirstDay: number; exchangesLastDay: number } | null> {
  const [membership] = await db
    .select({
      exchangesFirstDay: teams.exchangesFirstDay,
      exchangesLastDay: teams.exchangesLastDay,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId))
    .limit(1);
  return membership ?? null;
}

/**
 * Creates an exchange and debits the monthly balance in one transaction.
 */
export async function redeemAward(
  input: RedeemAwardInput,
  db: Db = getDb(),
): Promise<{ exchangeId: string; cost: number; balanceId: string }> {
  const now = input.now ?? new Date();
  const qty = Math.max(1, input.qty);

  return db.transaction(async (tx) => {
    const [award] = await tx
      .select({
        id: awards.id,
        active: awards.active,
        name: awards.name,
        title: awards.title,
      })
      .from(awards)
      .where(eq(awards.id, input.awardId))
      .limit(1);
    if (!award?.active) throw new Error("awardUnavailable");

    const [currency] = await tx
      .select({
        name: currencies.name,
        title: currencies.title,
        pluralTitle: currencies.pluralTitle,
      })
      .from(currencies)
      .where(eq(currencies.id, input.currencyId))
      .limit(1);
    if (!currency) throw new Error("currencyNotFound");

    const window = await findTeamWindowForUser(
      input.userId,
      tx as unknown as Db,
    );
    if (!window || !isExchangeWindowOpen(window, now)) {
      throw new Error("exchangeWindowClosed");
    }

    const prices = await loadAwardPrices(input.awardId, tx as unknown as Db);
    const cost = exchangeCost(prices, input.currencyId, qty);
    if (cost <= 0) throw new Error("invalidExchangeCost");

    const currencyPluralTitle = resolveCurrencyPluralTitle(currency);
    const balance = await getOrCreateMonthlyBalance(
      {
        userId: input.userId,
        currencyPluralTitle,
        now,
      },
      tx as unknown as Db,
    );

    if (!canAfford(balance.balance, cost)) {
      throw new Error("insufficientBalance");
    }

    await debitBalanceOutcome(
      { balanceId: balance.id, amount: cost },
      tx as unknown as Db,
    );

    const [exchange] = await tx
      .insert(exchanges)
      .values({
        userId: input.userId,
        awardTitle: resolveAwardHistoryTitle(award),
        currencyPluralTitle,
        qty,
        numberOf: cost,
        timestamp: now,
      })
      .returning({ id: exchanges.id });

    return { exchangeId: exchange.id, cost, balanceId: balance.id };
  });
}

export async function listRecentExchangesForUser(
  userId: string,
  limit = 20,
  db: Db = getDb(),
): Promise<ExchangeHistoryRecord[]> {
  const rows = await db
    .select({
      id: exchanges.id,
      timestamp: exchanges.timestamp,
      qty: exchanges.qty,
      awardTitle: exchanges.awardTitle,
    })
    .from(exchanges)
    .where(eq(exchanges.userId, userId))
    .orderBy(desc(exchanges.timestamp))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    qty: row.qty,
    awardTitle: row.awardTitle,
  }));
}
