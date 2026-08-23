import { and, eq, inArray } from "drizzle-orm";

import {
  awardPrices,
  awards,
  cartItems,
  carts,
  currencies,
  exchangeOrderItems,
  exchangeOrders,
  exchanges,
  teamMembers,
  teams,
} from "@/drizzle/schema";
import {
  cartItemCount,
  cartLineCost,
  cartTotal,
} from "@/lib/domain/cart";
import {
  cycleYearMonth,
  trimCartLinesForClose,
  type PricedCartLine,
} from "@/lib/domain/exchange-batch";
import {
  resolveAwardHistoryTitle,
  resolveCurrencyPluralTitle,
} from "@/lib/domain/currency-display";
import { getDb, type Db } from "@/lib/db/client";
import {
  debitBalanceOutcome,
  getOrCreateMonthlyBalance,
} from "@/lib/repos/balances";
import { getOrCreateBatch } from "@/lib/repos/exchange-batches";
import { getCurrencyForSubtasks } from "@/lib/repos/settings";

function shouldCloseTeamWindow(
  now: Date,
  exchangesLastDay: number,
): { close: boolean; cycle: { year: number; month: number } } {
  const utcDay = now.getUTCDate();
  const current = cycleYearMonth(now);

  if (utcDay > exchangesLastDay) {
    return { close: true, cycle: current };
  }

  // Day 1 of month: close leftover carts for previous month.
  if (utcDay === 1) {
    const prev =
      current.month === 1
        ? { year: current.year - 1, month: 12 }
        : { year: current.year, month: current.month - 1 };
    return { close: true, cycle: prev };
  }

  return { close: false, cycle: current };
}

async function userHasOrderForCycle(
  userId: string,
  year: number,
  month: number,
  db: Db,
): Promise<boolean> {
  const [row] = await db
    .select({ id: exchangeOrders.id })
    .from(exchangeOrders)
    .where(
      and(
        eq(exchangeOrders.userId, userId),
        eq(exchangeOrders.year, year),
        eq(exchangeOrders.month, month),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/**
 * Finalize one open cart into an order for a cycle (auto-close path).
 * Trims for affordability/stock; abandons cart if nothing remains.
 */
export async function finalizeOpenCartForCycle(input: {
  userId: string;
  year: number;
  month: number;
  now?: Date;
  db?: Db;
}): Promise<{ orderId: string; total: number } | null> {
  const now = input.now ?? new Date();
  const db = input.db ?? getDb();

  if (await userHasOrderForCycle(input.userId, input.year, input.month, db)) {
    return null;
  }

  return db.transaction(async (tx) => {
    if (
      await userHasOrderForCycle(
        input.userId,
        input.year,
        input.month,
        tx as unknown as Db,
      )
    ) {
      return null;
    }

    const payment = await getCurrencyForSubtasks(tx as unknown as Db);
    if (!payment?.currencyId) {
      return null;
    }

    const [cart] = await tx
      .select({ id: carts.id })
      .from(carts)
      .where(and(eq(carts.userId, input.userId), eq(carts.status, "open")))
      .limit(1);
    if (!cart) return null;

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

    if (lines.length === 0) {
      await tx
        .update(carts)
        .set({ status: "abandoned", updatedAt: now })
        .where(eq(carts.id, cart.id));
      return null;
    }

    const awardIds = lines.map((line) => line.awardId);
    const priceRows = await tx
      .select({
        awardId: awardPrices.awardId,
        currencyId: awardPrices.currencyId,
        numberOf: awardPrices.numberOf,
      })
      .from(awardPrices)
      .where(inArray(awardPrices.awardId, awardIds));

    const currencyIds = [...new Set(priceRows.map((price) => price.currencyId))];
    const currencyRows =
      currencyIds.length === 0
        ? []
        : await tx
            .select({
              id: currencies.id,
              name: currencies.name,
              title: currencies.title,
              pluralTitle: currencies.pluralTitle,
            })
            .from(currencies)
            .where(inArray(currencies.id, currencyIds));
    const currencyById = new Map(
      currencyRows.map((row) => [
        row.id,
        {
          id: row.id,
          name: row.name,
          title: row.title,
          pluralTitle: row.pluralTitle,
        },
      ]),
    );

    const pricedRaw: PricedCartLine[] = [];
    for (const line of lines) {
      if (!line.active || !line.showInStore) continue;
      const linePrices = priceRows.filter((price) => price.awardId === line.awardId);
      const chosen =
        linePrices.find((price) => price.currencyId === payment.currencyId) ??
        linePrices[0];
      if (!chosen || chosen.numberOf <= 0) continue;

      const lineCurrency = currencyById.get(chosen.currencyId);
      if (!lineCurrency) continue;

      pricedRaw.push({
        awardId: line.awardId,
        awardTitle: resolveAwardHistoryTitle(line),
        qty: line.qty,
        stock: line.stock,
        unitCost: chosen.numberOf,
        currencyId: chosen.currencyId,
        currencyPluralTitle: resolveCurrencyPluralTitle(lineCurrency),
      });
    }

    const paymentCurrency = currencyById.get(payment.currencyId);
    if (!paymentCurrency) {
      await tx
        .update(carts)
        .set({ status: "abandoned", updatedAt: now })
        .where(eq(carts.id, cart.id));
      return null;
    }

    const currencyPluralTitle = resolveCurrencyPluralTitle(paymentCurrency);
    const balanceByCurrency = new Map<string, number>();
    for (const title of new Set(pricedRaw.map((line) => line.currencyPluralTitle))) {
      const balance = await getOrCreateMonthlyBalance(
        {
          userId: input.userId,
          currencyPluralTitle: title,
          now,
        },
        tx as unknown as Db,
      );
      balanceByCurrency.set(title, balance.balance);
    }

    const priced = trimCartLinesForClose(
      pricedRaw,
      (title) => balanceByCurrency.get(title) ?? 0,
    );
    if (priced.length === 0) {
      await tx
        .update(carts)
        .set({ status: "abandoned", updatedAt: now })
        .where(eq(carts.id, cart.id));
      return null;
    }

    const total = cartTotal(
      priced.map((line) => ({ unitCost: line.unitCost, qty: line.qty })),
    );
    const itemCount = cartItemCount(priced);

    const debitByCurrency = new Map<string, number>();
    for (const line of priced) {
      const lineCost = cartLineCost(line.unitCost, line.qty);
      debitByCurrency.set(
        line.currencyPluralTitle,
        (debitByCurrency.get(line.currencyPluralTitle) ?? 0) + lineCost,
      );
    }

    const balanceIdByCurrency = new Map<string, string>();
    for (const title of debitByCurrency.keys()) {
      const balance = await getOrCreateMonthlyBalance(
        {
          userId: input.userId,
          currencyPluralTitle: title,
          now,
        },
        tx as unknown as Db,
      );
      balanceIdByCurrency.set(title, balance.id);
    }

    for (const [title, amount] of debitByCurrency) {
      const balanceId = balanceIdByCurrency.get(title);
      if (!balanceId) continue;
      await debitBalanceOutcome(
        { balanceId, amount },
        tx as unknown as Db,
      );
    }

    for (const line of priced) {
      const [fresh] = await tx
        .select({ stock: awards.stock })
        .from(awards)
        .where(eq(awards.id, line.awardId))
        .limit(1);
      const nextStock = Math.max(0, (fresh?.stock ?? 0) - line.qty);
      await tx
        .update(awards)
        .set({ stock: nextStock, updatedAt: now })
        .where(eq(awards.id, line.awardId));
    }

    const batch = await getOrCreateBatch(
      input.year,
      input.month,
      tx as unknown as Db,
    );

    const [order] = await tx
      .insert(exchangeOrders)
      .values({
        userId: input.userId,
        batchId: batch.id,
        status: "completed",
        currencyPluralTitle,
        totalNumberOf: total,
        itemCount,
        year: input.year,
        month: input.month,
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
        lineNumberOf: cartLineCost(line.unitCost, line.qty),
        currencyId: line.currencyId,
        currencyPluralTitle: line.currencyPluralTitle,
      })),
    );

    await tx.insert(exchanges).values(
      priced.map((line) => ({
        userId: input.userId,
        orderId: order.id,
        awardTitle: line.awardTitle,
        currencyPluralTitle: line.currencyPluralTitle,
        qty: line.qty,
        numberOf: cartLineCost(line.unitCost, line.qty),
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

/**
 * Idempotent auto-close of open carts whose team exchange window has ended.
 */
export async function closeOpenCartsForCycle(
  now: Date = new Date(),
): Promise<{ closed: number; abandoned: number }> {
  const db = getDb();
  const activeTeams = await db
    .select({
      id: teams.id,
      exchangesLastDay: teams.exchangesLastDay,
    })
    .from(teams)
    .where(eq(teams.active, true));

  let closed = 0;
  let abandoned = 0;

  for (const team of activeTeams) {
    const decision = shouldCloseTeamWindow(now, team.exchangesLastDay);
    if (!decision.close) continue;

    const members = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, team.id));

    for (const member of members) {
      const result = await finalizeOpenCartForCycle({
        userId: member.userId,
        year: decision.cycle.year,
        month: decision.cycle.month,
        now,
        db,
      });
      if (result) closed += 1;
      else {
        const [openCart] = await db
          .select({ status: carts.status })
          .from(carts)
          .where(
            and(eq(carts.userId, member.userId), eq(carts.status, "abandoned")),
          )
          .limit(1);
        if (openCart) abandoned += 1;
      }
    }
  }

  return { closed, abandoned };
}
