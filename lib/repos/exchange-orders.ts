import { and, desc, eq } from "drizzle-orm";

import { exchangeOrderItems, exchangeOrders } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

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
