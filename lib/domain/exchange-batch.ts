/**
 * Monthly exchange batch visibility and cycle helpers (UTC).
 */

export type CycleYearMonth = { year: number; month: number };

export function cycleYearMonth(date: Date): CycleYearMonth {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

export function maxActiveTeamLastDay(
  teams: ReadonlyArray<{ exchangesLastDay: number }>,
): number {
  if (teams.length === 0) return 0;
  return Math.max(...teams.map((team) => team.exchangesLastDay));
}

/** Batch for a month is visible after the max last-day among active teams. */
export function isBatchVisible(now: Date, maxLastDay: number): boolean {
  if (maxLastDay <= 0) return false;
  return now.getUTCDate() > maxLastDay;
}

export type PricedCartLine = {
  awardId: string;
  awardTitle: string;
  qty: number;
  stock: number;
  unitCost: number;
  currencyId: string;
  currencyPluralTitle: string;
};

function trimCartLinesForSingleCurrency(
  lines: PricedCartLine[],
  balance: number,
): PricedCartLine[] {
  const stockSafe = lines
    .map((line) => ({
      ...line,
      qty: Math.min(line.qty, Math.max(0, line.stock)),
    }))
    .filter((line) => line.qty > 0 && line.unitCost > 0);

  const sorted = [...stockSafe].sort((a, b) => a.unitCost - b.unitCost);
  const kept: PricedCartLine[] = [];
  let total = 0;

  for (const line of sorted) {
    const lineCost = line.unitCost * line.qty;
    if (total + lineCost <= balance) {
      kept.push(line);
      total += lineCost;
      continue;
    }
    const affordableQty = Math.floor((balance - total) / line.unitCost);
    if (affordableQty > 0) {
      kept.push({ ...line, qty: affordableQty });
      total += line.unitCost * affordableQty;
    }
  }

  return kept;
}

/**
 * Clamp qty to stock, drop empty lines, then drop highest unitCost lines
 * until the cart is affordable (or empty).
 */
export function trimCartLinesForClose(
  lines: PricedCartLine[],
  balance: number | ((currencyPluralTitle: string) => number),
): PricedCartLine[] {
  const getBalance =
    typeof balance === "function" ? balance : () => balance;

  const groups = new Map<string, PricedCartLine[]>();
  for (const line of lines) {
    const key = line.currencyPluralTitle;
    const list = groups.get(key) ?? [];
    list.push(line);
    groups.set(key, list);
  }

  const kept: PricedCartLine[] = [];
  for (const [currencyPluralTitle, groupLines] of groups) {
    kept.push(
      ...trimCartLinesForSingleCurrency(
        groupLines,
        getBalance(currencyPluralTitle),
      ),
    );
  }

  return kept;
}
