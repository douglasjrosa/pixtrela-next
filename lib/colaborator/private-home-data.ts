import { eq } from "drizzle-orm";

import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  awardPricesFromValues,
  exchangeCost,
  isExchangeWindowOpen,
} from "@/lib/business/exchange";
import type { CurrencyBalanceProps } from "@/lib/colaborator/balance-view";
import type { AwardView } from "@/components/exchange/award-card";
import { getDb } from "@/lib/db/client";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { getOrCreateMonthlyBalance } from "@/lib/repos/balances";
import { listAwards } from "@/lib/repos/awards";
import { listRecentExchangesForUser } from "@/lib/repos/exchanges";
import { getCurrencyForSubtasks } from "@/lib/repos/settings";
import { findActiveTeamWindowForUser } from "@/lib/repos/teams";
import { awardPrices, currencies } from "@/drizzle/schema";

const HISTORY_LIMIT = 20;

interface TeamEntity {
  exchangesFirstDay: number;
  exchangesLastDay: number;
}

export interface ExchangeHistoryRow {
  documentId: string;
  timestamp: string;
  awardTitle: string;
  qty: number;
}

export interface ColaboratorPrivateHomeData {
  balance: CurrencyBalanceProps;
  awards: AwardView[];
  windowOpen: boolean;
  spendableBalance: number;
  team: TeamEntity | null;
  history: ExchangeHistoryRow[];
}

const EMPTY_BALANCE: CurrencyBalanceProps = {
  balance: 0,
  previousBalance: 0,
  totalIncome: 0,
  totalOutcome: 0,
};

export async function loadColaboratorPrivateHome(
  userId: string,
): Promise<ColaboratorPrivateHomeData> {
  try {
    const payment = await getCurrencyForSubtasks();
    const team = await findActiveTeamWindowForUser(userId);
    const windowOpen = team ? isExchangeWindowOpen(team, new Date()) : false;

    let balance: CurrencyBalanceProps = { ...EMPTY_BALANCE };
    if (payment) {
      const monthly = await getOrCreateMonthlyBalance({
        userId,
        currencyPluralTitle:
          payment.currencyPluralTitle ||
          payment.currencyTitle ||
          payment.currencyName,
      });
      balance = {
        balance: monthly.balance,
        previousBalance: monthly.previousBalance,
        totalIncome: monthly.totalIncome,
        totalOutcome: monthly.totalOutcome,
        currencyLabel:
          payment.currencyPluralTitle || payment.currencyTitle || undefined,
      };
    }

    const awardRows = await listAwards();
    const db = getDb();
    const paymentCurrencyName = payment?.currencyName ?? "";
    const awards: AwardView[] = [];

    for (const award of awardRows) {
      if (!award.active) continue;
      const prices = await db
        .select({
          numberOf: awardPrices.numberOf,
          currencyName: currencies.name,
        })
        .from(awardPrices)
        .innerJoin(currencies, eq(awardPrices.currencyId, currencies.id))
        .where(eq(awardPrices.awardId, award.id));

      const priceTable = awardPricesFromValues(
        prices.map((price) => ({
          numberOf: price.numberOf,
          currency: { name: price.currencyName },
        })),
      );

      awards.push({
        id: award.id,
        title: award.title ?? award.name,
        description: award.description ?? undefined,
        currency: paymentCurrencyName,
        cost: paymentCurrencyName
          ? exchangeCost(priceTable, paymentCurrencyName, 1)
          : 0,
        imageUrl: award.imageUrl,
      });
    }

    const historyRows = await listRecentExchangesForUser(userId, HISTORY_LIMIT);
    const history = historyRows.map((entry) => ({
      documentId: entry.id,
      timestamp: entry.timestamp.toISOString(),
      awardTitle: entry.awardTitle || "—",
      qty: entry.qty,
    }));

    return {
      balance,
      awards,
      windowOpen,
      spendableBalance: balance.balance,
      team,
      history,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return {
      balance: EMPTY_BALANCE,
      awards: [],
      windowOpen: false,
      spendableBalance: 0,
      team: null,
      history: [],
    };
  }
}
