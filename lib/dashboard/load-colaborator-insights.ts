import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";

import type { ColaboratorInsightsData } from "./types";

const EMPTY_INSIGHTS: ColaboratorInsightsData = {
  colaboratorDocumentId: "",
  month: "",
  dailyIncomeByCurrency: [],
  previousMonthsByCurrency: [],
};

export async function loadColaboratorInsights(
  documentId: string,
): Promise<ColaboratorInsightsData> {
  if (!documentId) return EMPTY_INSIGHTS;

  try {
    return { ...EMPTY_INSIGHTS, colaboratorDocumentId: documentId };
  } catch (error) {
    rethrowIfNavigationError(error);
    return { ...EMPTY_INSIGHTS, colaboratorDocumentId: documentId };
  }
}
