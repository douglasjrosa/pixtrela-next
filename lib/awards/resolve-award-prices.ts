import { inArray } from "drizzle-orm";

import { currencies } from "@/drizzle/schema";
import { calculateAwardNumberOf } from "@/lib/domain/award-pricing";
import { getDb, type Db } from "@/lib/db/client";

export type ManualAwardPrice = {
  currencyId: string;
  numberOf: number;
};

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

  const activeCurrencyIds = input.manualPrices
    .filter((price) => price.numberOf > 0)
    .map((price) => price.currencyId);

  if (activeCurrencyIds.length === 0) {
    return input.manualPrices;
  }

  const rows = await db
    .select({
      id: currencies.id,
      exchangeRate: currencies.exchangeRate,
      active: currencies.active,
    })
    .from(currencies)
    .where(inArray(currencies.id, activeCurrencyIds));

  const exchangeRateById = new Map(
    rows
      .filter((row) => row.active)
      .map((row) => [row.id, Number(row.exchangeRate ?? 0)]),
  );

  return input.manualPrices.map((price) => {
    if (price.numberOf <= 0) {
      return price;
    }

    const exchangeRate = exchangeRateById.get(price.currencyId) ?? 0;
    return {
      currencyId: price.currencyId,
      numberOf: calculateAwardNumberOf(input.actualPrice, exchangeRate),
    };
  });
}
