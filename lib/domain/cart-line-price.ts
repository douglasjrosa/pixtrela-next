export type AwardPriceOption = {
  awardId: string;
  currencyId: string;
  numberOf: number;
};

/** Price for a cart line: matching currency only, never the first row. */
export function findCartLineAwardPrice<T extends AwardPriceOption>(
  prices: ReadonlyArray<T>,
  awardId: string,
  currencyId: string,
): T | null {
  const chosen = prices.find(
    (price) =>
      price.awardId === awardId &&
      price.currencyId === currencyId &&
      price.numberOf > 0,
  );
  return chosen ?? null;
}
