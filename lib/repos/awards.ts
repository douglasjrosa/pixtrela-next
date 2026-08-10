import { eq } from "drizzle-orm";

import { awardPrices, awards, currencies, mediaAssets } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

export type AwardRecord = {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  warnings: string | null;
  active: boolean;
  imageUrl: string | null;
};

export type CreateAwardInput = {
  name: string;
  title?: string | null;
  description?: string | null;
  warnings?: string | null;
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
      imageUrl: mediaAssets.url,
    })
    .from(awards)
    .leftJoin(mediaAssets, eq(awards.imageMediaId, mediaAssets.id))
    .orderBy(awards.name);
  return rows;
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
      imageMediaId: input.imageMediaId ?? null,
    })
    .returning({
      id: awards.id,
      name: awards.name,
      title: awards.title,
      description: awards.description,
      warnings: awards.warnings,
      active: awards.active,
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
    })
    .from(currencies)
    .orderBy(currencies.name);
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
