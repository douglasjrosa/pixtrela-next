import type { CurrencyRanking, RankingRow } from "@/lib/dashboard/types";

export interface RankingPosition {
  row: RankingRow | null;
  nextRow: RankingRow | null;
  starsToNext: number | null;
  topRows: RankingRow[];
}

const TOP_PODIUM_COUNT = 3;

export function resolveRankingPosition(
  rows: RankingRow[],
  userDocumentId: string,
): RankingPosition {
  const topRows = rows.slice(0, TOP_PODIUM_COUNT);
  const index = rows.findIndex((row) => row.userDocumentId === userDocumentId);
  if (index < 0) {
    return { row: null, nextRow: null, starsToNext: null, topRows };
  }

  const row = rows[index];
  const nextRow = index > 0 ? rows[index - 1] : null;
  const starsToNext =
    nextRow === null ? null : Math.max(0, nextRow.totalIncome - row.totalIncome);

  return { row, nextRow, starsToNext, topRows };
}

export function primaryCurrencyRanking(
  currencies: CurrencyRanking[],
): CurrencyRanking | null {
  return currencies[0] ?? null;
}
