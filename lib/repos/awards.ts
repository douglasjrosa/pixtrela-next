import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";

import { awardPrices, awards, currencies, mediaAssets } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";
import type { AwardListSort } from "@/lib/schemas/award-list-sort";

export type AwardRecord = {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  warnings: string | null;
  active: boolean;
  showInStore: boolean;
  stock: number;
  imageUrl: string | null;
};

export type CreateAwardInput = {
  name: string;
  title?: string | null;
  description?: string | null;
  warnings?: string | null;
  active?: boolean;
  showInStore?: boolean;
  stock?: number;
  imageMediaId?: string | null;
  prices?: Array<{ currencyId: string; numberOf: number }>;
};

export async function listAwards(db: Db = getDb()): Promise<AwardRecord[]> {
  const rows = await db
    .select({
      id: awards.id,
      name: awards.name,
      title: awards.title,
      description: awards.description,
      warnings: awards.warnings,
      active: awards.active,
      showInStore: awards.showInStore,
      stock: awards.stock,
      imageUrl: mediaAssets.url,
    })
    .from(awards)
    .leftJoin(mediaAssets, eq(awards.imageMediaId, mediaAssets.id))
    .orderBy(awards.name);
  return rows;
}

export type AwardPriceRef = {
  numberOf: number;
  currencyId: string;
};

export type AwardListItem = AwardRecord & {
  imageMediaId: string | null;
  prices: AwardPriceRef[];
};

const AWARD_TITLE_SORT_EXPR = sql`
  coalesce(nullif(${awards.title}, ''), ${awards.name})
`;
const AWARD_MIN_COST_EXPR = sql<number>`
  coalesce(min(${awardPrices.numberOf}), 0)
`;

function awardListOrderBy(sort: AwardListSort) {
  const dir = sort.direction === "desc" ? desc : asc;
  if (sort.column === "starCost") {
    return [
      dir(AWARD_MIN_COST_EXPR),
      asc(AWARD_TITLE_SORT_EXPR),
      asc(awards.id),
    ];
  }
  return [dir(AWARD_TITLE_SORT_EXPR), asc(awards.id)];
}

async function loadPricesByAwardIds(
  awardIds: string[],
  db: Db,
): Promise<Map<string, AwardPriceRef[]>> {
  const pricesByAward = new Map<string, AwardPriceRef[]>();
  if (awardIds.length === 0) return pricesByAward;

  const rows = await db
    .select({
      awardId: awardPrices.awardId,
      numberOf: awardPrices.numberOf,
      currencyId: awardPrices.currencyId,
    })
    .from(awardPrices)
    .where(inArray(awardPrices.awardId, awardIds));

  for (const row of rows) {
    const list = pricesByAward.get(row.awardId) ?? [];
    list.push({
      numberOf: Math.max(1, Math.floor(row.numberOf)),
      currencyId: row.currencyId,
    });
    pricesByAward.set(row.awardId, list);
  }
  return pricesByAward;
}

export async function listAwardsPage(
  options: {
    q?: string;
    page?: number;
    pageSize?: number;
    sort?: AwardListSort;
    showArchived?: boolean;
  } = {},
  db: Db = getDb(),
): Promise<{ items: AwardListItem[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const offset = (page - 1) * pageSize;
  const q = options.q?.trim();
  const sort = options.sort ?? { column: "title", direction: "asc" };

  const activeClause = options.showArchived
    ? undefined
    : eq(awards.active, true);

  const searchClause = q
    ? or(
        ilike(awards.name, `%${q}%`),
        ilike(awards.title, `%${q}%`),
      )
    : undefined;

  const where = and(activeClause, searchClause);

  const [totalRow] = await db
    .select({ total: count() })
    .from(awards)
    .where(where);

  const rows = await db
    .select({
      id: awards.id,
      name: awards.name,
      title: awards.title,
      description: awards.description,
      warnings: awards.warnings,
      active: awards.active,
      showInStore: awards.showInStore,
      stock: awards.stock,
      imageMediaId: awards.imageMediaId,
      imageUrl: mediaAssets.url,
    })
    .from(awards)
    .leftJoin(mediaAssets, eq(awards.imageMediaId, mediaAssets.id))
    .leftJoin(awardPrices, eq(awardPrices.awardId, awards.id))
    .where(where)
    .groupBy(
      awards.id,
      awards.name,
      awards.title,
      awards.description,
      awards.warnings,
      awards.active,
      awards.showInStore,
      awards.stock,
      awards.imageMediaId,
      mediaAssets.url,
    )
    .orderBy(...awardListOrderBy(sort))
    .limit(pageSize)
    .offset(offset);

  const pricesByAward = await loadPricesByAwardIds(
    rows.map((row) => row.id),
    db,
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      title: row.title,
      description: row.description,
      warnings: row.warnings,
      active: row.active,
      showInStore: row.showInStore,
      stock: row.stock,
      imageMediaId: row.imageMediaId,
      imageUrl: row.imageUrl,
      prices: pricesByAward.get(row.id) ?? [],
    })),
    total: totalRow?.total ?? 0,
  };
}

export async function createAward(
  input: CreateAwardInput,
  db: Db = getDb(),
): Promise<AwardRecord> {
  const name = input.name.trim();
  if (!name) throw new Error("awardNameRequired");

  const [row] = await db
    .insert(awards)
    .values({
      name,
      title: input.title ?? null,
      description: input.description ?? null,
      warnings: input.warnings ?? null,
      active: input.active ?? true,
      showInStore: input.showInStore ?? true,
      stock: input.stock ?? 0,
      imageMediaId: input.imageMediaId ?? null,
    })
    .returning({
      id: awards.id,
      name: awards.name,
      title: awards.title,
      description: awards.description,
      warnings: awards.warnings,
      active: awards.active,
      showInStore: awards.showInStore,
      stock: awards.stock,
      imageMediaId: awards.imageMediaId,
    });

  if (input.prices?.length) {
    await db.insert(awardPrices).values(
      input.prices.map((price) => ({
        awardId: row.id,
        currencyId: price.currencyId,
        numberOf: price.numberOf,
      })),
    );
  }

  let imageUrl: string | null = null;
  if (row.imageMediaId) {
    const [media] = await db
      .select({ url: mediaAssets.url })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, row.imageMediaId))
      .limit(1);
    imageUrl = media?.url ?? null;
  }

  return {
    id: row.id,
    name: row.name,
    title: row.title,
    description: row.description,
    warnings: row.warnings,
    active: row.active,
    showInStore: row.showInStore,
    stock: row.stock,
    imageUrl,
  };
}

export async function listCurrencies(db: Db = getDb()) {
  return db
    .select({
      id: currencies.id,
      name: currencies.name,
      title: currencies.title,
      pluralTitle: currencies.pluralTitle,
      currencyPerSecond: currencies.currencyPerSecond,
      iconMediaId: currencies.iconMediaId,
      iconMediaUrl: mediaAssets.url,
    })
    .from(currencies)
    .leftJoin(mediaAssets, eq(currencies.iconMediaId, mediaAssets.id))
    .orderBy(currencies.name);
}

export async function findCurrencyById(
  id: string,
  db: Db = getDb(),
): Promise<{
  id: string;
  name: string;
  title: string | null;
  pluralTitle: string | null;
} | null> {
  const [row] = await db
    .select({
      id: currencies.id,
      name: currencies.name,
      title: currencies.title,
      pluralTitle: currencies.pluralTitle,
    })
    .from(currencies)
    .where(eq(currencies.id, id))
    .limit(1);
  return row ?? null;
}

export async function createCurrency(
  input: {
    name: string;
    title?: string;
    pluralTitle?: string;
    currencyPerSecond: number;
    iconMediaId?: string | null;
  },
  db: Db = getDb(),
) {
  const [row] = await db
    .insert(currencies)
    .values({
      name: input.name.trim(),
      title: input.title ?? null,
      pluralTitle: input.pluralTitle ?? null,
      currencyPerSecond: input.currencyPerSecond,
      iconMediaId:
        typeof input.iconMediaId === "string" ? input.iconMediaId : null,
    })
    .returning();
  return row;
}

export async function replaceAwardPrices(
  awardId: string,
  prices: Array<{ currencyId: string; numberOf: number }>,
  db: Db = getDb(),
): Promise<void> {
  await db.delete(awardPrices).where(eq(awardPrices.awardId, awardId));
  if (prices.length === 0) return;
  await db.insert(awardPrices).values(
    prices.map((price) => ({
      awardId,
      currencyId: price.currencyId,
      numberOf: price.numberOf,
    })),
  );
}

export async function findAwardById(
  id: string,
  db: Db = getDb(),
): Promise<AwardRecord | null> {
  const [row] = await db
    .select({
      id: awards.id,
      name: awards.name,
      title: awards.title,
      description: awards.description,
      warnings: awards.warnings,
      active: awards.active,
      showInStore: awards.showInStore,
      stock: awards.stock,
      imageUrl: mediaAssets.url,
    })
    .from(awards)
    .leftJoin(mediaAssets, eq(awards.imageMediaId, mediaAssets.id))
    .where(eq(awards.id, id))
    .limit(1);
  return row ?? null;
}

export async function deleteAward(id: string, db: Db = getDb()): Promise<void> {
  await db
    .update(awards)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(awards.id, id));
}

export async function hardDeleteAward(
  id: string,
  db: Db = getDb(),
): Promise<void> {
  await db.delete(awards).where(eq(awards.id, id));
}
