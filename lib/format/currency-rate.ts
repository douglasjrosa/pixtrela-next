const CURRENCY_RATE_DECIMALS = 2;
const CURRENCY_RATE_FACTOR = 10 ** CURRENCY_RATE_DECIMALS;

export function roundCurrencyRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * CURRENCY_RATE_FACTOR) / CURRENCY_RATE_FACTOR;
}

export function formatCurrencyPerSecond(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: CURRENCY_RATE_DECIMALS,
    maximumFractionDigits: CURRENCY_RATE_DECIMALS,
  }).format(roundCurrencyRate(value));
}
