import {
  DEFAULT_DECIMAL_PLACES,
  formatDecimalPtBr,
  roundDecimal,
} from "@/lib/format/decimal";

export function roundCurrencyRate(value: number): number {
  return roundDecimal(value, DEFAULT_DECIMAL_PLACES);
}

export function formatCurrencyPerSecond(value: number): string {
  return formatDecimalPtBr(value, DEFAULT_DECIMAL_PLACES);
}

export function formatExchangeRate(value: number): string {
  return formatDecimalPtBr(value, DEFAULT_DECIMAL_PLACES);
}
