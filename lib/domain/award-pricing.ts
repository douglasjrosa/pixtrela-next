export const AWARD_PRICE_CENTS_PER_REAL = 100;

/**
 * Converts a BRL actual price into virtual currency units using the currency
 * exchange rate (units per centavo).
 */
export function calculateAwardNumberOf(
  actualPrice: number,
  exchangeRate: number,
): number {
  if (actualPrice <= 0 || exchangeRate <= 0) {
    return 0;
  }

  return Math.round(
    actualPrice * AWARD_PRICE_CENTS_PER_REAL * exchangeRate,
  );
}
