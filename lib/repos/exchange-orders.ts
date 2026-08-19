import { and, desc, eq, inArray } from "drizzle-orm";

import {
  awardPrices,
  awards,
  cartItems,
  carts,
  currencies,
  exchangeOrderItems,
  exchangeOrders,
  exchanges,
} from "@/drizzle/schema";
import {
  canAffordCart,
  cartItemCount,
  cartLineCost,
  cartTotal,
} from "@/lib/domain/cart";
import {
  resolveAwardHistoryTitle,
  resolveCurrencyPluralTitle,
} from "@/lib/domain/currency-display";
import {
  canAfford,
  exchangeCost,
  isExchangeWindowOpen,
} from "@/lib/domain/exchange";
import { getDb, type Db } from "@/lib/db/client";
import {
  debitBalanceOutcome,
  getOrCreateMonthlyBalance,
} from "@/lib/repos/balances";
import { getCurrencyForSubtasks } from "@/lib/repos/settings";
import { findActiveTeamWindowForUser } from "@/lib/repos/teams";

export type ExchangeOrderListItem = {
  id: string;
  status: "completed" | "cancelled";
  currencyPluralTitle: string;
  totalNumberOf: number;
  itemCount: number;
  checkedOutAt: Date;
};

export type ExchangeOrderDetail = ExchangeOrderListItem & {
  items: Array<{
    id: string;
    awardId: string | null;
    awardTitle: string;
    qty: number;
    unitNumberOf: number;
    lineNumberOf: number;
  }>;
};

export async function listOrdersForUser(
  userId: string,
  limit = 20,
  db: Db = getDb(),
): Promise<ExchangeOrderListItem[]> {
  const rows = await db
    .select({
      id: exchangeOrders.id,
      status: exchangeOrders.status,
      currencyPluralTitle: exchangeOrders.currencyPluralTitle,
      totalNumberOf: exchangeOrders.totalNumberOf,
      itemCount: exchangeOrders.itemCount,
      checkedOutAt: exchangeOrders.checkedOutAt,
    })
    .from(exchangeOrders)
    .where(eq(exchangeOrders.userId, userId))
    .orderBy(desc(exchangeOrders.checkedOutAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    currencyPluralTitle: row.currencyPluralTitle,
    totalNumberOf: row.totalNumberOf,
    itemCount: row.itemCount,
    checkedOutAt: row.checkedOutAt,
  }));
}

export async function getOrderForUser(
  userId: string,
  orderId: string,
  db: Db = getDb(),
): Promise<ExchangeOrderDetail | null> {
  const [order] = await db
    .select({
      id: exchangeOrders.id,
      status: exchangeOrders.status,
      currencyPluralTitle: exchangeOrders.currencyPluralTitle,
      totalNumberOf: exchangeOrders.totalNumberOf,
      itemCount: exchangeOrders.itemCount,
      checkedOutAt: exchangeOrders.checkedOutAt,
    })
    .from(exchangeOrders)
    .where(
      and(eq(exchangeOrders.id, orderId), eq(exchangeOrders.userId, userId)),
    )
    .limit(1);

  if (!order) return null;

  const items = await db
    .select({
      id: exchangeOrderItems.id,
      awardId: exchangeOrderItems.awardId,
      awardTitle: exchangeOrderItems.awardTitle,
      qty: exchangeOrderItems.qty,
      unitNumberOf: exchangeOrderItems.unitNumberOf,
      lineNumberOf: exchangeOrderItems.lineNumberOf,
    })
    .from(exchangeOrderItems)
    .where(eq(exchangeOrderItems.orderId, order.id));

  return {
    id: order.id,
    status: order.status,
    currencyPluralTitle: order.currencyPluralTitle,
    totalNumberOf: order.totalNumberOf,
    itemCount: order.itemCount,
    checkedOutAt: order.checkedOutAt,
    items,
  };
}

/**
 * Atomically checks out the user's open cart into an exchange order.
 */
export async function checkoutCart(input: {
  userId: string;
  now?: Date;
}): Promise<{ orderId: string; total: number }> {
  const now = input.now ?? new Date();
  const db = getDb();

  return db.transaction(async (tx) => {
    const payment = await getCurrencyForSubtasks(tx as unknown as Db);
    if (!payment?.currencyId) throw new Error("currencyNotFound");

    const team = await findActiveTeamWindowForUser(
      input.userId,
      tx as unknown as Db,
    );
    if (!team) throw new Error("noTeam");
    if (!isExchangeWindowOpen(team, now)) {
      throw new Error("exchangeWindowClosed");
    }

    const [cart] = await tx
      .select({ id: carts.id })
      .from(carts)
      .where(and(eq(carts.userId, input.userId), eq(carts.status, "open")))
      .limit(1);
    if (!cart) throw new Error("cartEmpty");

    const lines = await tx
      .select({
        itemId: cartItems.id,
        awardId: cartItems.awardId,
        qty: cartItems.qty,
        name: awards.name,
        title: awards.title,
        active: awards.active,
        showInStore: awards.showInStore,
        stock: awards.stock,
      })
      .from(cartItems)
      .innerJoin(awards, eq(cartItems.awardId, awards.id))
      .where(eq(cartItems.cartId, cart.id));

    if (lines.length === 0) throw new Error("cartEmpty");

    const awardIds = lines.map((line) => line.awardId);
    const priceRows = await tx
      .select({
        awardId: awardPrices.awardId,
        currencyId: awardPrices.currencyId,
        numberOf: awardPrices.numberOf,
      })
      .from(awardPrices)
      .where(inArray(awardPrices.awardId, awardIds));

    const priced = lines.map((line) => {
      if (!line.active || !line.showInStore) {
        throw new Error("awardUnavailable");
      }
      if (line.stock < line.qty) throw new Error("awardOutOfStock");

      const unitCost = exchangeCost(
        priceRows
          .filter((price) => price.awardId === line.awardId)
          .map((price) => ({
            currencyId: price.currencyId,
            currencyName: price.currencyId,
            qty: price.numberOf,
          })),
        payment.currencyId,
        1,
      );
      if (unitCost <= 0) throw new Error("invalidExchangeCost");

      const lineCost = cartLineCost(unitCost, line.qty);
      return {
        ...line,
        awardTitle: resolveAwardHistoryTitle(line),
        unitCost,
        lineCost,
      };
    });

    const total = cartTotal(
      priced.map((line) => ({ unitCost: line.unitCost, qty: line.qty })),
    );
    const itemCount = cartItemCount(priced);
    if (total <= 0 || itemCount <= 0) throw new Error("invalidExchangeCost");

    const currency = await tx
      .select({
        name: currencies.name,
        title: currencies.title,
        pluralTitle: currencies.pluralTitle,
      })
      .from(currencies)
      .where(eq(currencies.id, payment.currencyId))
      .limit(1)
      .then((rows) => rows[0]);
    if (!currency) throw new Error("currencyNotFound");

    const currencyPluralTitle = resolveCurrencyPluralTitle(currency);
    const balance = await getOrCreateMonthlyBalance(
      {
        userId: input.userId,
        currencyPluralTitle,
        now,
      },
      tx as unknown as Db,
    );

    if (!canAfford(balance.balance, total) || !canAffordCart(balance.balance, total)) {
      throw new Error("insufficientBalance");
    }

    await debitBalanceOutcome(
      { balanceId: balance.id, amount: total },
      tx as unknown as Db,
    );

    for (const line of priced) {
      await tx
        .update(awards)
        .set({ stock: line.stock - line.qty, updatedAt: now })
        .where(eq(awards.id, line.awardId));
    }

    const [order] = await tx
      .insert(exchangeOrders)
      .values({
        userId: input.userId,
        status: "completed",
        currencyPluralTitle,
        totalNumberOf: total,
        itemCount,
        checkedOutAt: now,
      })
      .returning({ id: exchangeOrders.id });

    await tx.insert(exchangeOrderItems).values(
      priced.map((line) => ({
        orderId: order.id,
        awardId: line.awardId,
        awardTitle: line.awardTitle,
        qty: line.qty,
        unitNumberOf: line.unitCost,
        lineNumberOf: line.lineCost,
      })),
    );

    await tx.insert(exchanges).values(
      priced.map((line) => ({
        userId: input.userId,
        orderId: order.id,
        awardTitle: line.awardTitle,
        currencyPluralTitle,
        qty: line.qty,
        numberOf: line.lineCost,
        timestamp: now,
      })),
    );

    await tx
      .update(carts)
      .set({ status: "checked_out", updatedAt: now })
      .where(eq(carts.id, cart.id));

    return { orderId: order.id, total };
  });
}
