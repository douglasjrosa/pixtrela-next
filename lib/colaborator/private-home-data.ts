import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { isExchangeWindowOpen } from "@/lib/domain/exchange";
import type { CurrencyBalanceProps } from "@/lib/colaborator/balance-view";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { getOrCreateMonthlyBalance } from "@/lib/repos/balances";
import { listRecentExchangesForUser } from "@/lib/repos/exchanges";
import { getCurrencyForSubtasks } from "@/lib/repos/settings";
import { findActiveTeamWindowForUser } from "@/lib/repos/teams";

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
      const currencyLabel = resolveCurrencyPluralTitle({
        pluralTitle: payment.currencyPluralTitle,
        title: payment.currencyTitle,
        name: payment.currencyName,
      });
      const monthly = await getOrCreateMonthlyBalance({
        userId,
        currencyPluralTitle: currencyLabel,
      });
      balance = {
        balance: monthly.balance,
        previousBalance: monthly.previousBalance,
        totalIncome: monthly.totalIncome,
        totalOutcome: monthly.totalOutcome,
        currencyLabel,
      };
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
      windowOpen,
      spendableBalance: balance.balance,
      team,
      history,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return {
      balance: EMPTY_BALANCE,
      windowOpen: false,
      spendableBalance: 0,
      team: null,
      history: [],
    };
  }
}
