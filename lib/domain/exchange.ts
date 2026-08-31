/**
 * Pure exchange (redemption) rules — canonical domain.
 */

export interface ExchangeWindow {
  exchangesFirstDay: number;
  exchangesLastDay: number;
}

export interface AwardPrice {
  currencyId: string;
  currencyName: string;
  qty: number;
}

/** Calendar length for the UTC month containing `date`. */
export function daysInUtcMonth(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Last exchange day for a month (caps configured day to month length). */
export function effectiveExchangeLastDay(
  configuredLastDay: number,
  date: Date,
): number {
  return Math.min(configuredLastDay, daysInUtcMonth(date));
}

export function isExchangeWindowOpen(
  team: ExchangeWindow,
  date: Date,
): boolean {
  const day = date.getUTCDate();
  const lastDay = effectiveExchangeLastDay(team.exchangesLastDay, date);
  return day >= team.exchangesFirstDay && day <= lastDay;
}

export function exchangeCost(
  prices: AwardPrice[],
  currencyId: string,
  qty: number,
): number {
  const entry = prices.find((price) => price.currencyId === currencyId);
  if (!entry) return 0;
  return entry.qty * Math.max(0, qty);
}

export function canAfford(balance: number, cost: number): boolean {
  return cost > 0 && balance >= cost;
}
