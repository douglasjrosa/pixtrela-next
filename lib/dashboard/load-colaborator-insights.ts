import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { dashboardColaboratorTag, strapiFetch } from "@/lib/strapi";

import type { ColaboratorInsightsData } from "./types";

interface InsightsResponse {
  data: ColaboratorInsightsData | null;
}

const EMPTY_INSIGHTS: ColaboratorInsightsData = {
  colaboratorDocumentId: "",
  month: "",
  dailyIncomeByCurrency: [],
  previousMonthsByCurrency: [],
};

export async function loadColaboratorInsights(
  documentId: string,
  month?: string,
): Promise<ColaboratorInsightsData> {
  if (!documentId) return EMPTY_INSIGHTS;

  const query = month ? `?month=${encodeURIComponent(month)}` : "";

  try {
    const response = await strapiFetch<InsightsResponse>(
      `/dashboard/colaborator/${documentId}/insights${query}`,
      {
        strapiCache: {
          tags: [dashboardColaboratorTag(documentId)],
          revalidate: 60,
        },
      },
    );
    return response.data ?? { ...EMPTY_INSIGHTS, colaboratorDocumentId: documentId };
  } catch (error) {
    rethrowIfNavigationError(error);
    return { ...EMPTY_INSIGHTS, colaboratorDocumentId: documentId };
  }
}
