import type { Role } from "@/lib/auth/nav";
import type {
  ColaboratorInsightsData,
  ColaboratorOption,
  CurrencyRanking,
  MonthlyRankingData,
} from "@/lib/dashboard/types";

import { ColaboratorInsightsSection } from "./colaborator-insights-section";
import { MonthlyRankingPanel } from "./monthly-ranking-panel";

export interface DashboardInsightsBlockProps {
  showRanking?: boolean;
  ranking: MonthlyRankingData;
  mode: "staff" | "self";
  role: Role;
  colaboratorOptions: ColaboratorOption[];
  selectedDocumentId: string;
  selectedName: string;
  insights: ColaboratorInsightsData;
}

export function DashboardInsightsBlock({
  showRanking = false,
  ranking,
  mode,
  role,
  colaboratorOptions,
  selectedDocumentId,
  selectedName,
  insights,
}: DashboardInsightsBlockProps) {
  const currencyRankings: CurrencyRanking[] = ranking.currencies;

  return (
    <div className="space-y-10">
      {showRanking ? (
        <MonthlyRankingPanel
          month={ranking.month}
          currencies={ranking.currencies}
        />
      ) : null}

      {selectedDocumentId ? (
        <ColaboratorInsightsSection
          mode={mode}
          role={role}
          colaboratorOptions={colaboratorOptions}
          selectedDocumentId={selectedDocumentId}
          selectedName={selectedName}
          insights={insights}
          currencyRankings={currencyRankings}
        />
      ) : null}
    </div>
  );
}
