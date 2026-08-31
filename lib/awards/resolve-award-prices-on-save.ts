import { inArray } from "drizzle-orm";

import { currencies } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

import {
  resolveAwardPrices,
  type ManualAwardPrice,
} from "./resolve-award-prices";

export type { ManualAwardPrice } from "./resolve-award-prices";

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
