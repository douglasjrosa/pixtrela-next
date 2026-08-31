import { calculateAwardNumberOf } from "@/lib/domain/award-pricing";

export type ManualAwardPrice = {
  currencyId: string;
  numberOf: number;
};

export type ExchangeRateLookup =
  | ReadonlyMap<string, number>
  | Record<string, number>;

function readExchangeRate(
  exchangeRateById: ExchangeRateLookup,
  currencyId: string,
): number {
  if (exchangeRateById instanceof Map) {
    return exchangeRateById.get(currencyId) ?? 0;
  }
  const rates = exchangeRateById as Record<string, number>;
  return rates[currencyId] ?? 0;
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
