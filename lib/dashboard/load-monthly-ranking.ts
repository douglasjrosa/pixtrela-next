import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import type { MonthlyRankingData } from "./types";

interface MonthlyRankingResponse {
  data: MonthlyRankingData | null;
}

const EMPTY_RANKING: MonthlyRankingData = {
  month: "",
  currencies: [],
};

export async function loadMonthlyRanking(): Promise<MonthlyRankingData> {
  try {
    const response = await strapiFetch<MonthlyRankingResponse>(
      "/dashboard/monthly-ranking",
      {
        strapiCache: {
          tags: [STRAPI_TAGS.dashboardRanking],
          revalidate: 60,
        },
      },
    );
    return response.data ?? EMPTY_RANKING;
  } catch (error) {
    rethrowIfNavigationError(error);
    return EMPTY_RANKING;
  }
}
