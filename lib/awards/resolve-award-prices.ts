import { inArray } from "drizzle-orm";

import { currencies } from "@/drizzle/schema";
import { calculateAwardNumberOf } from "@/lib/domain/award-pricing";
import { getDb, type Db } from "@/lib/db/client";

export type ManualAwardPrice = {
  currencyId: string;
  numberOf: number;
};

export type ExchangeRateLookup =
  | ReadonlyMap<string, number>
  | Readonly<Record<string, number>>;

function readExchangeRate(
  exchangeRateById: ExchangeRateLookup,
  currencyId: string,
): number {
  if (exchangeRateById instanceof Map) {
    return exchangeRateById.get(currencyId) ?? 0;
  }
  return exchangeRateById[currencyId] ?? 0;
}

/** Pure pricing resolver shared by the award form and save actions. */
export function resolveAwardPrices(input: {
  autoRecalculate: boolean;
  actualPrice: number;
  manualPrices: ManualAwardPrice[];
  exchangeRateById: ExchangeRateLookup;
}): ManualAwardPrice[] {
  if (!input.autoRecalculate) {
    return input.manualPrices;
  }

  return input.manualPrices.map((price) => ({
    currencyId: price.currencyId,
    numberOf: calculateAwardNumberOf(
      input.actualPrice,
      readExchangeRate(input.exchangeRateById, price.currencyId),
    ),
  }));
}

export async function resolveAwardPricesOnSave(
  input: {
    autoRecalculate: boolean;
    actualPrice: number;
    manualPrices: ManualAwardPrice[];
  },
  db: Db = getDb(),
): Promise<ManualAwardPrice[]> {
  if (!input.autoRecalculate) {
    return input.manualPrices;
  }

  const currencyIds = input.manualPrices.map((price) => price.currencyId);
  if (currencyIds.length === 0) {
    return input.manualPrices;
  }

  const rows = await db
    .select({
      id: currencies.id,
      exchangeRate: currencies.exchangeRate,
      active: currencies.active,
    })
    .from(currencies)
    .where(inArray(currencies.id, currencyIds));

  const exchangeRateById = new Map(
    rows
      .filter((row) => row.active)
      .map((row) => [row.id, Number(row.exchangeRate ?? 0)]),
  );

  return resolveAwardPrices({
    autoRecalculate: true,
    actualPrice: input.actualPrice,
    manualPrices: input.manualPrices,
    exchangeRateById,
  });
}
