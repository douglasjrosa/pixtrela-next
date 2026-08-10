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

export function isExchangeWindowOpen(
  team: ExchangeWindow,
  date: Date,
): boolean {
  const day = date.getUTCDate();
  return day >= team.exchangesFirstDay && day <= team.exchangesLastDay;
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
