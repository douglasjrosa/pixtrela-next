import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { isExchangeWindowOpen } from "@/lib/domain/exchange";
import type { CurrencyBalanceProps } from "@/lib/colaborator/balance-view";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { getOrCreateMonthlyBalance } from "@/lib/repos/balances";
import { listOrdersForUser } from "@/lib/repos/exchange-orders";
import { getCurrencyForSubtasks } from "@/lib/repos/settings";
import { findActiveTeamWindowForUser } from "@/lib/repos/teams";

const ORDERS_PREVIEW_LIMIT = 5;

interface TeamEntity {
  exchangesFirstDay: number;
  exchangesLastDay: number;
}

export interface OrderHistoryPreview {
  id: string;
  checkedOutAt: string;
  itemCount: number;
  totalNumberOf: number;
  currencyPluralTitle: string;
  status: "completed" | "cancelled";
}

export interface ColaboratorPrivateHomeData {
  balance: CurrencyBalanceProps;
  windowOpen: boolean;
  spendableBalance: number;
  team: TeamEntity | null;
  orders: OrderHistoryPreview[];
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

    const orderRows = await listOrdersForUser(userId, ORDERS_PREVIEW_LIMIT);
    const orders = orderRows.map((entry) => ({
      id: entry.id,
      checkedOutAt: entry.checkedOutAt.toISOString(),
      itemCount: entry.itemCount,
      totalNumberOf: entry.totalNumberOf,
      currencyPluralTitle: entry.currencyPluralTitle,
      status: entry.status,
    }));

    return {
      balance,
      windowOpen,
      spendableBalance: balance.balance,
      team,
      orders,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return {
      balance: EMPTY_BALANCE,
      windowOpen: false,
      spendableBalance: 0,
      team: null,
      orders: [],
    };
  }
}
