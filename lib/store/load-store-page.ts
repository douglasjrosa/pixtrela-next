import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { unstable_cache } from "next/cache";

import { awardPrices, awards, currencies, mediaAssets } from "@/drizzle/schema";
import { getDb } from "@/lib/db/client";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { isExchangeWindowOpen } from "@/lib/domain/exchange";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { getOrCreateMonthlyBalance } from "@/lib/repos/balances";
import { listOpenCartItemRows } from "@/lib/repos/carts";
import { findActiveTeamWindowForUser } from "@/lib/repos/teams";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import {
  mergeCatalogWithCart,
  type StoreCurrencyView,
} from "@/lib/store/merge-catalog-with-cart";

export const STORE_AWARDS_CACHE_TAG = "drizzle:awards";
export const STORE_CURRENCIES_CACHE_TAG = "drizzle:currencies";

interface TeamEntity {
  exchangesFirstDay: number;
  exchangesLastDay: number;
}

export interface StorePageData {
  currencies: StoreCurrencyView[];
  cards: ReturnType<typeof mergeCatalogWithCart>;
  windowOpen: boolean;
  team: TeamEntity | null;
}

const awardImages = alias(mediaAssets, "award_images");

interface CatalogAwardRow {
  awardId: string;
  name: string;
  title: string | null;
  stock: number;
  imageUrl: string | null;
  currencyId: string;
  currencyName: string;
  currencyTitle: string | null;
  currencyPluralTitle: string | null;
  currencyActive: boolean;
  currencyShowInStore: boolean;
  numberOf: number;
}

async function fetchStoreCatalogRows(): Promise<CatalogAwardRow[]> {
  const db = getDb();
  return db
    .select({
      awardId: awards.id,
      name: awards.name,
      title: awards.title,
      stock: awards.stock,
      imageUrl: awardImages.url,
      currencyId: awardPrices.currencyId,
      currencyName: currencies.name,
      currencyTitle: currencies.title,
      currencyPluralTitle: currencies.pluralTitle,
      currencyActive: currencies.active,
      currencyShowInStore: currencies.showInStore,
      numberOf: awardPrices.numberOf,
    })
    .from(awards)
    .innerJoin(awardPrices, eq(awardPrices.awardId, awards.id))
    .innerJoin(currencies, eq(awardPrices.currencyId, currencies.id))
    .leftJoin(awardImages, eq(awards.imageMediaId, awardImages.id))
    .where(and(eq(awards.active, true), eq(awards.showInStore, true)));
}

const loadCachedStoreCatalog = unstable_cache(
  async (): Promise<CatalogAwardRow[]> => fetchStoreCatalogRows(),
  ["store-awards-catalog"],
  {
    tags: [STORE_AWARDS_CACHE_TAG, STORE_CURRENCIES_CACHE_TAG],
    revalidate: 60,
  },
);

async function loadStoreCurrencies(
  userId: string,
): Promise<StoreCurrencyView[]> {
  const db = getDb();
  const rows = await db
    .select({
      currencyId: currencies.id,
      name: currencies.name,
      title: currencies.title,
      pluralTitle: currencies.pluralTitle,
      iconUrl: mediaAssets.url,
    })
    .from(currencies)
    .leftJoin(mediaAssets, eq(currencies.iconMediaId, mediaAssets.id))
    .where(and(eq(currencies.active, true), eq(currencies.showInStore, true)))
    .orderBy(currencies.name);

  const result: StoreCurrencyView[] = [];
  for (const row of rows) {
    const label = resolveCurrencyPluralTitle({
      pluralTitle: row.pluralTitle,
      title: row.title,
      name: row.name,
    });
    const monthly = await getOrCreateMonthlyBalance({
      userId,
      currencyPluralTitle: label,
    });
    result.push({
      currencyId: row.currencyId,
      label,
      iconUrl: toBrowserMediaUrl(row.iconUrl),
      balance: monthly.balance,
    });
  }
  return result;
}

export async function loadStorePage(userId: string): Promise<StorePageData> {
  try {
    const team = await findActiveTeamWindowForUser(userId);
    const windowOpen = team ? isExchangeWindowOpen(team, new Date()) : false;
    const [catalogRows, cartRows, storeCurrencies] = await Promise.all([
      loadCachedStoreCatalog(),
      listOpenCartItemRows(userId),
      loadStoreCurrencies(userId),
    ]);

    const cards = mergeCatalogWithCart(
      catalogRows.map((row) => ({
        awardId: row.awardId,
        title: row.title ?? row.name,
        stock: row.stock,
        imageUrl: row.imageUrl,
        currencyId: row.currencyId,
        unitCost: row.numberOf,
        currencyActive: row.currencyActive,
        currencyShowInStore: row.currencyShowInStore,
      })),
      storeCurrencies,
      cartRows,
    );

    return {
      currencies: storeCurrencies,
      cards,
      windowOpen,
      team,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return {
      currencies: [],
      cards: [],
      windowOpen: false,
      team: null,
    };
  }
}

/** Exported for tests — bypasses unstable_cache. */
export async function loadStoreCatalogUncached(): Promise<CatalogAwardRow[]> {
  return fetchStoreCatalogRows();
}
