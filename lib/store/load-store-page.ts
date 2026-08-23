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
import { listOpenCartItemRows } from "@/lib/repos/carts";
import { getCurrencyForSubtasks } from "@/lib/repos/settings";
import { findActiveTeamWindowForUser } from "@/lib/repos/teams";
import { mergeCatalogWithCart } from "@/lib/store/merge-catalog-with-cart";

export const STORE_AWARDS_CACHE_TAG = "drizzle:awards";
export const STORE_CURRENCIES_CACHE_TAG = "drizzle:currencies";

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

export interface StoreCatalogLine {
  awardId: string;
  title: string;
  qty: number;
  stock: number;
  imageUrl: string | null;
  unitCost: number;
}

export interface StorePageData {
  balance: CurrencyBalanceProps;
  spendableBalance: number;
  paymentCurrencyId: string | null;
  catalogLines: StoreCatalogLine[];
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
    const [catalogRows, cartRows] = await Promise.all([
      loadCachedStoreCatalog(),
      listOpenCartItemRows(userId),
    ]);
    const awards = paymentCurrencyId
      ? mapCatalogToAwards(catalogRows, paymentCurrencyId)
      : [];
    const catalogLines = mergeCatalogWithCart(awards, cartRows);

    return {
      balance,
      spendableBalance: balance.balance,
      paymentCurrencyId,
      catalogLines,
      windowOpen,
      team,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return {
      balance: EMPTY_BALANCE,
      spendableBalance: 0,
      paymentCurrencyId: null,
      catalogLines: [],
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
