import type { MonthlyRankingData } from "./types";

/** Places shown on the home ranking when the viewer is a colaborator. */
export const MONTHLY_RANKING_PODIUM_SIZE = 3;

export function monthlyRankingForViewer(
  ranking: MonthlyRankingData,
  role: string | undefined,
): MonthlyRankingData {
  if (role !== "colaborator") return ranking;

  return {
    ...ranking,
    currencies: ranking.currencies.map((currency) => ({
      ...currency,
      rows: currency.rows.slice(0, MONTHLY_RANKING_PODIUM_SIZE),
    })),
  };
}
