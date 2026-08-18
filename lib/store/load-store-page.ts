import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { awardPrices, awards, currencies, mediaAssets } from "@/drizzle/schema";
import type { CurrencyBalanceProps } from "@/lib/colaborator/balance-view";
import { getDb } from "@/lib/db/client";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import {
  exchangeCost,
  isExchangeWindowOpen,
} from "@/lib/domain/exchange";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { getOrCreateMonthlyBalance } from "@/lib/repos/balances";
import { getCurrencyForSubtasks } from "@/lib/repos/settings";
import { findActiveTeamWindowForUser } from "@/lib/repos/teams";

export const STORE_AWARDS_CACHE_TAG = "drizzle:awards";
export const STORE_CURRENCIES_CACHE_TAG = "drizzle:currencies";

export const STORE_LOW_STOCK_THRESHOLD = 5;
export const STORE_ALMOST_PROGRESS = 0.7;

export type StoreFilter = "all" | "affordable" | "almost" | "lowStock";
export type StoreSort = "priceAsc" | "priceDesc";

export interface StoreAwardView {
  id: string;
  title: string;
  description?: string;
  warnings?: string;
  currencyId: string;
  currencyLabel: string;
  cost: number;
  stock: number;
  imageUrl?: string | null;
}

interface TeamEntity {
  exchangesFirstDay: number;
  exchangesLastDay: number;
}

export interface StorePageData {
  balance: CurrencyBalanceProps;
  spendableBalance: number;
  paymentCurrencyId: string | null;
  awards: StoreAwardView[];
  windowOpen: boolean;
  team: TeamEntity | null;
}

const EMPTY_BALANCE: CurrencyBalanceProps = {
  balance: 0,
  previousBalance: 0,
  totalIncome: 0,
  totalOutcome: 0,
};

interface CatalogAwardRow {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  warnings: string | null;
  stock: number;
  imageUrl: string | null;
  currencyId: string;
  currencyName: string;
  currencyTitle: string | null;
  currencyPluralTitle: string | null;
  numberOf: number;
}

async function fetchStoreCatalogRows(): Promise<CatalogAwardRow[]> {
  const db = getDb();
  return db
    .select({
      id: awards.id,
      name: awards.name,
      title: awards.title,
      description: awards.description,
      warnings: awards.warnings,
      stock: awards.stock,
      imageUrl: mediaAssets.url,
      currencyId: awardPrices.currencyId,
      currencyName: currencies.name,
      currencyTitle: currencies.title,
      currencyPluralTitle: currencies.pluralTitle,
      numberOf: awardPrices.numberOf,
    })
    .from(awards)
    .innerJoin(awardPrices, eq(awardPrices.awardId, awards.id))
    .innerJoin(currencies, eq(awardPrices.currencyId, currencies.id))
    .leftJoin(mediaAssets, eq(awards.imageMediaId, mediaAssets.id))
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

function mapCatalogToAwards(
  rows: CatalogAwardRow[],
  paymentCurrencyId: string,
): StoreAwardView[] {
  const byAward = new Map<string, StoreAwardView>();

  for (const row of rows) {
    if (row.currencyId !== paymentCurrencyId) continue;

    const existing = byAward.get(row.id);
    if (existing) continue;

    const currencyLabel = resolveCurrencyPluralTitle({
      pluralTitle: row.currencyPluralTitle,
      title: row.currencyTitle,
      name: row.currencyName,
    });

    byAward.set(row.id, {
      id: row.id,
      title: row.title ?? row.name,
      description: row.description ?? undefined,
      warnings: row.warnings ?? undefined,
      currencyId: row.currencyId,
      currencyLabel,
      cost: exchangeCost(
        [
          {
            currencyId: row.currencyId,
            currencyName: row.currencyName,
            qty: row.numberOf,
          },
        ],
        paymentCurrencyId,
        1,
      ),
      stock: row.stock,
      imageUrl: row.imageUrl,
    });
  }

  return Array.from(byAward.values());
}

export function parseStoreFilter(value: string | undefined): StoreFilter {
  if (
    value === "affordable" ||
    value === "almost" ||
    value === "lowStock" ||
    value === "all"
  ) {
    return value;
  }
  return "all";
}

export function parseStoreSort(value: string | undefined): StoreSort {
  if (value === "priceDesc" || value === "priceAsc") return value;
  return "priceAsc";
}

export function filterAndSortStoreAwards(
  awards: StoreAwardView[],
  balance: number,
  filter: StoreFilter,
  sort: StoreSort,
): StoreAwardView[] {
  let filtered = awards;

  if (filter === "affordable") {
    filtered = awards.filter(
      (award) => award.cost > 0 && balance >= award.cost && award.stock > 0,
    );
  } else if (filter === "almost") {
    filtered = awards.filter((award) => {
      if (award.cost <= 0 || award.stock <= 0) return false;
      const progress = balance / award.cost;
      return progress >= STORE_ALMOST_PROGRESS && progress < 1;
    });
  } else if (filter === "lowStock") {
    filtered = awards.filter(
      (award) =>
        award.stock > 0 && award.stock <= STORE_LOW_STOCK_THRESHOLD,
    );
  }

  const sorted = [...filtered].sort((a, b) =>
    sort === "priceDesc" ? b.cost - a.cost : a.cost - b.cost,
  );
  return sorted;
}

/** Lowest-cost in-stock awards, then low-stock urgency. */
export function pickFeaturedAwards(
  awards: StoreAwardView[],
  limit = 6,
): StoreAwardView[] {
  const inStock = awards.filter((award) => award.stock > 0 && award.cost > 0);
  const byPrice = [...inStock].sort((a, b) => a.cost - b.cost);
  const lowStock = [...inStock]
    .filter((award) => award.stock <= STORE_LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);

  const seen = new Set<string>();
  const featured: StoreAwardView[] = [];

  for (const award of [...lowStock, ...byPrice]) {
    if (seen.has(award.id)) continue;
    seen.add(award.id);
    featured.push(award);
    if (featured.length >= limit) break;
  }

  return featured;
}

export async function loadStorePage(userId: string): Promise<StorePageData> {
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

    const paymentCurrencyId = payment?.currencyId ?? null;
    const catalogRows = await loadCachedStoreCatalog();
    const awards = paymentCurrencyId
      ? mapCatalogToAwards(catalogRows, paymentCurrencyId)
      : [];

    return {
      balance,
      spendableBalance: balance.balance,
      paymentCurrencyId,
      awards,
      windowOpen,
      team,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return {
      balance: EMPTY_BALANCE,
      spendableBalance: 0,
      paymentCurrencyId: null,
      awards: [],
      windowOpen: false,
      team: null,
    };
  }
}

/** Exported for tests — bypasses unstable_cache. */
export async function loadStoreCatalogUncached(
  paymentCurrencyId: string,
): Promise<StoreAwardView[]> {
  const rows = await fetchStoreCatalogRows();
  return mapCatalogToAwards(rows, paymentCurrencyId);
}
