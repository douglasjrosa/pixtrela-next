import { and, desc, eq, inArray, sql } from "drizzle-orm";

import {
  awards,
  exchangeBatches,
  exchangeOrderItems,
  exchangeOrders,
  teamMembers,
  teams,
  users,
} from "@/drizzle/schema";
import {
  cycleYearMonth,
  isBatchVisible,
  maxActiveTeamLastDay,
} from "@/lib/domain/exchange-batch";
import type { Role } from "@/lib/auth/nav";
import { getDb, type Db } from "@/lib/db/client";

export type ExchangeBatchListItem = {
  id: string;
  year: number;
  month: number;
  status: "pending" | "ready";
  orderCount: number;
  totalItemCount: number;
  totalNumberOf: number;
};

export type BatchShoppingLine = {
  awardId: string | null;
  awardTitle: string;
  qty: number;
  actualPrice: number;
};

export type BatchDeliveryOrder = {
  orderId: string;
  userId: string;
  userName: string;
  currencyPluralTitle: string;
  totalNumberOf: number;
  itemCount: number;
  items: Array<{
    awardTitle: string;
    qty: number;
    unitNumberOf: number;
    lineNumberOf: number;
  }>;
};

export type ExchangeBatchDetail = {
  id: string;
  year: number;
  month: number;
  status: "pending" | "ready";
  shoppingList: BatchShoppingLine[];
  deliveries: BatchDeliveryOrder[];
};

async function listActiveTeamLastDays(
  db: Db,
): Promise<Array<{ exchangesLastDay: number }>> {
  return db
    .select({ exchangesLastDay: teams.exchangesLastDay })
    .from(teams)
    .where(eq(teams.active, true));
}

export async function getOrCreateBatch(
  year: number,
  month: number,
  db: Db = getDb(),
): Promise<{ id: string; status: "pending" | "ready" }> {
  const [existing] = await db
    .select({
      id: exchangeBatches.id,
      status: exchangeBatches.status,
    })
    .from(exchangeBatches)
    .where(
      and(eq(exchangeBatches.year, year), eq(exchangeBatches.month, month)),
    )
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(exchangeBatches)
    .values({ year, month, status: "pending" })
    .returning({
      id: exchangeBatches.id,
      status: exchangeBatches.status,
    });
  return created;
}

export async function ensureBatchesReady(
  now: Date = new Date(),
  db: Db = getDb(),
): Promise<void> {
  const { year, month } = cycleYearMonth(now);
  const prev =
    month === 1
      ? { year: year - 1, month: 12 }
      : { year, month: month - 1 };

  for (const cycle of [prev, { year, month }]) {
    const batch = await getOrCreateBatch(cycle.year, cycle.month, db);
    if (batch.status === "ready") continue;

    const lastDays = await listActiveTeamLastDays(db);
    const maxLast = maxActiveTeamLastDay(lastDays);
    const visible =
      cycle.year === year && cycle.month === month
        ? isBatchVisible(now, maxLast)
        : true;

    if (visible) {
      await db
        .update(exchangeBatches)
        .set({ status: "ready", updatedAt: now })
        .where(eq(exchangeBatches.id, batch.id));
    }
  }
}

export async function listLeaderTeamMemberIds(
  leaderUserId: string,
  db: Db = getDb(),
): Promise<string[]> {
  const leaderTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.leaderId, leaderUserId), eq(teams.active, true)));
  if (leaderTeams.length === 0) return [];

  const members = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(
      inArray(
        teamMembers.teamId,
        leaderTeams.map((team) => team.id),
      ),
    );
  return [...new Set(members.map((member) => member.userId))];
}

export async function listBatchesForStaff(input: {
  role: Role;
  userId: string;
  db?: Db;
}): Promise<{
  batches: ExchangeBatchListItem[];
  availableFromDay: number | null;
}> {
  const db = input.db ?? getDb();
  await ensureBatchesReady(new Date(), db);

  const lastDays = await listActiveTeamLastDays(db);
  const maxLast = maxActiveTeamLastDay(lastDays);
  const availableFromDay = maxLast > 0 ? maxLast + 1 : null;

  const rows = await db
    .select({
      id: exchangeBatches.id,
      year: exchangeBatches.year,
      month: exchangeBatches.month,
      status: exchangeBatches.status,
      orderCount: sql<number>`count(${exchangeOrders.id})::int`,
      totalItemCount: sql<number>`coalesce(sum(${exchangeOrders.itemCount}), 0)::int`,
      totalNumberOf: sql<number>`coalesce(sum(${exchangeOrders.totalNumberOf}), 0)`,
    })
    .from(exchangeBatches)
    .leftJoin(
      exchangeOrders,
      eq(exchangeOrders.batchId, exchangeBatches.id),
    )
    .where(eq(exchangeBatches.status, "ready"))
    .groupBy(
      exchangeBatches.id,
      exchangeBatches.year,
      exchangeBatches.month,
      exchangeBatches.status,
    )
    .orderBy(desc(exchangeBatches.year), desc(exchangeBatches.month));

  let batches: ExchangeBatchListItem[] = rows.map((row) => ({
    id: row.id,
    year: row.year,
    month: row.month,
    status: row.status,
    orderCount: row.orderCount,
    totalItemCount: row.totalItemCount,
    totalNumberOf: Number(row.totalNumberOf),
  }));

  if (input.role === "leader") {
    const memberIds = await listLeaderTeamMemberIds(input.userId, db);
    if (memberIds.length === 0) {
      return { batches: [], availableFromDay };
    }
    const scoped: ExchangeBatchListItem[] = [];
    for (const batch of batches) {
      const [countRow] = await db
        .select({
          orderCount: sql<number>`count(*)::int`,
          totalItemCount: sql<number>`coalesce(sum(${exchangeOrders.itemCount}), 0)::int`,
          totalNumberOf: sql<number>`coalesce(sum(${exchangeOrders.totalNumberOf}), 0)`,
        })
        .from(exchangeOrders)
        .where(
          and(
            eq(exchangeOrders.batchId, batch.id),
            inArray(exchangeOrders.userId, memberIds),
          ),
        );
      if ((countRow?.orderCount ?? 0) > 0) {
        scoped.push({
          ...batch,
          orderCount: countRow.orderCount,
          totalItemCount: countRow.totalItemCount,
          totalNumberOf: Number(countRow.totalNumberOf),
        });
      }
    }
    batches = scoped;
  }

  return { batches, availableFromDay };
}

export async function getBatchDetailForStaff(input: {
  batchId: string;
  role: Role;
  userId: string;
  db?: Db;
}): Promise<ExchangeBatchDetail | null> {
  const db = input.db ?? getDb();
  const [batch] = await db
    .select({
      id: exchangeBatches.id,
      year: exchangeBatches.year,
      month: exchangeBatches.month,
      status: exchangeBatches.status,
    })
    .from(exchangeBatches)
    .where(eq(exchangeBatches.id, input.batchId))
    .limit(1);
  if (!batch || batch.status !== "ready") return null;

  let memberFilter: string[] | null = null;
  if (input.role === "leader") {
    memberFilter = await listLeaderTeamMemberIds(input.userId, db);
    if (memberFilter.length === 0) return null;
  }

  const orderRows = await db
    .select({
      orderId: exchangeOrders.id,
      userId: exchangeOrders.userId,
      userName: users.name,
      userLastName: users.lastName,
      currencyPluralTitle: exchangeOrders.currencyPluralTitle,
      totalNumberOf: exchangeOrders.totalNumberOf,
      itemCount: exchangeOrders.itemCount,
    })
    .from(exchangeOrders)
    .innerJoin(users, eq(exchangeOrders.userId, users.id))
    .where(
      memberFilter
        ? and(
            eq(exchangeOrders.batchId, batch.id),
            inArray(exchangeOrders.userId, memberFilter),
          )
        : eq(exchangeOrders.batchId, batch.id),
    )
    .orderBy(users.name);

  if (input.role === "leader" && orderRows.length === 0) return null;

  const orderIds = orderRows.map((row) => row.orderId);
  const itemRows =
    orderIds.length === 0
      ? []
      : await db
          .select({
            orderId: exchangeOrderItems.orderId,
            awardId: exchangeOrderItems.awardId,
            awardTitle: exchangeOrderItems.awardTitle,
            qty: exchangeOrderItems.qty,
            unitNumberOf: exchangeOrderItems.unitNumberOf,
            lineNumberOf: exchangeOrderItems.lineNumberOf,
          })
          .from(exchangeOrderItems)
          .where(inArray(exchangeOrderItems.orderId, orderIds));

  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  const awardIds = [
    ...new Set(
      itemRows
        .map((item) => item.awardId)
        .filter((awardId): awardId is string => awardId !== null),
    ),
  ];
  const awardPriceRows =
    awardIds.length === 0
      ? []
      : await db
          .select({
            id: awards.id,
            actualPrice: awards.actualPrice,
          })
          .from(awards)
          .where(inArray(awards.id, awardIds));
  const actualPriceByAwardId = new Map(
    awardPriceRows.map((row) => [row.id, Number(row.actualPrice ?? 0)]),
  );

  const shoppingMap = new Map<string, BatchShoppingLine>();
  for (const item of itemRows) {
    const key = item.awardId ?? item.awardTitle;
    const actualPrice = item.awardId
      ? (actualPriceByAwardId.get(item.awardId) ?? 0)
      : 0;
    const existing = shoppingMap.get(key);
    if (existing) {
      existing.qty += item.qty;
    } else {
      shoppingMap.set(key, {
        awardId: item.awardId,
        awardTitle: item.awardTitle,
        qty: item.qty,
        actualPrice,
      });
    }
  }

  return {
    id: batch.id,
    year: batch.year,
    month: batch.month,
    status: batch.status,
    shoppingList: [...shoppingMap.values()].sort((a, b) =>
      a.awardTitle.localeCompare(b.awardTitle),
    ),
    deliveries: orderRows.map((row) => ({
      orderId: row.orderId,
      userId: row.userId,
      userName: [row.userName, row.userLastName].filter(Boolean).join(" "),
      currencyPluralTitle: row.currencyPluralTitle,
      totalNumberOf: row.totalNumberOf,
      itemCount: row.itemCount,
      items: (itemsByOrder.get(row.orderId) ?? []).map((item) => ({
        awardTitle: item.awardTitle,
        qty: item.qty,
        unitNumberOf: item.unitNumberOf,
        lineNumberOf: item.lineNumberOf,
      })),
    })),
  };
}
