import { eq } from "drizzle-orm";

import { awardPrices, currencies } from "@/drizzle/schema";
import {
  cartItemCount,
  cartLineCost,
  cartTotal,
} from "@/lib/domain/cart";
import type { CurrencyBalanceProps } from "@/lib/colaborator/balance-view";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { exchangeCost, isExchangeWindowOpen } from "@/lib/domain/exchange";
import { getDb } from "@/lib/db/client";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { getOrCreateMonthlyBalance } from "@/lib/repos/balances";
import {
  countOpenCartItems,
  listOpenCartItemRows,
  type CartItemView,
} from "@/lib/repos/carts";
import { getCurrencyForSubtasks } from "@/lib/repos/settings";
import { findActiveTeamWindowForUser } from "@/lib/repos/teams";

export type CartPageData = {
  items: CartItemView[];
  itemCount: number;
  total: number;
  balance: CurrencyBalanceProps;
  spendableBalance: number;
  windowOpen: boolean;
  team: { exchangesFirstDay: number; exchangesLastDay: number } | null;
  paymentCurrencyId: string | null;
};

const EMPTY_BALANCE: CurrencyBalanceProps = {
  balance: 0,
  previousBalance: 0,
  totalIncome: 0,
  totalOutcome: 0,
};

export async function loadCartPage(userId: string): Promise<CartPageData> {
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

    const rows = await listOpenCartItemRows(userId);
    const paymentCurrencyId = payment?.currencyId ?? null;
    const db = getDb();
    const items: CartItemView[] = [];

    for (const row of rows) {
      let unitCost = 0;
      let currencyId = paymentCurrencyId ?? "";
      let currencyLabel = balance.currencyLabel ?? "";

      if (paymentCurrencyId) {
        const prices = await db
          .select({
            currencyId: awardPrices.currencyId,
            numberOf: awardPrices.numberOf,
            currencyName: currencies.name,
            currencyTitle: currencies.title,
            currencyPluralTitle: currencies.pluralTitle,
          })
          .from(awardPrices)
          .innerJoin(currencies, eq(awardPrices.currencyId, currencies.id))
          .where(eq(awardPrices.awardId, row.awardId));

        const match = prices.find((price) => price.currencyId === paymentCurrencyId);
        if (match) {
          currencyId = match.currencyId;
          currencyLabel = resolveCurrencyPluralTitle({
            pluralTitle: match.currencyPluralTitle,
            title: match.currencyTitle,
            name: match.currencyName,
          });
          unitCost = exchangeCost(
            [
              {
                currencyId: match.currencyId,
                currencyName: match.currencyName,
                qty: match.numberOf,
              },
            ],
            paymentCurrencyId,
            1,
          );
        }
      }

      items.push({
        id: row.id,
        awardId: row.awardId,
        title: row.title,
        qty: row.qty,
        stock: row.stock,
        imageUrl: row.imageUrl,
        unitCost,
        lineCost: cartLineCost(unitCost, row.qty),
        currencyId,
        currencyLabel,
      });
    }

    return {
      items,
      itemCount: cartItemCount(items),
      total: cartTotal(
        items.map((item) => ({ unitCost: item.unitCost, qty: item.qty })),
      ),
      balance,
      spendableBalance: balance.balance,
      windowOpen,
      team,
      paymentCurrencyId,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return {
      items: [],
      itemCount: 0,
      total: 0,
      balance: EMPTY_BALANCE,
      spendableBalance: 0,
      windowOpen: false,
      team: null,
      paymentCurrencyId: null,
    };
  }
}

export async function loadOpenCartItemCount(userId: string): Promise<number> {
  try {
    return await countOpenCartItems(userId);
  } catch (error) {
    rethrowIfNavigationError(error);
    return 0;
  }
}
