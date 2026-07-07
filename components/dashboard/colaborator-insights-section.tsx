import { useTranslations } from "next-intl";

import type { Role } from "@/lib/auth/nav";
import type {
  ColaboratorInsightsData,
  ColaboratorOption,
  CurrencyRanking,
} from "@/lib/dashboard/types";

import {
  ColaboratorLabel,
  ColaboratorPicker,
} from "./colaborator-picker";
import {
  DailyIncomeTable,
  PreviousMonthsSummary,
} from "./colaborator-insights-panels";

export interface ColaboratorInsightsSectionProps {
  mode: "staff" | "self";
  role: Role;
  colaboratorOptions: ColaboratorOption[];
  selectedDocumentId: string;
  selectedName: string;
  insights: ColaboratorInsightsData;
  currencyRankings: CurrencyRanking[];
}

export function ColaboratorInsightsSection({
  mode,
  role,
  colaboratorOptions,
  selectedDocumentId,
  selectedName,
  insights,
  currencyRankings,
}: ColaboratorInsightsSectionProps) {
  const t = useTranslations("dashboard");

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("insightsTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("insightsDescription")}</p>
      </div>

      {mode === "staff" && role !== "colaborator" ? (
        <ColaboratorPicker
          options={colaboratorOptions}
          selectedDocumentId={selectedDocumentId}
        />
      ) : (
        <ColaboratorLabel name={selectedName} />
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-medium">{t("dailyIncomeTitle")}</h3>
        <DailyIncomeTable
          dailyIncomeByCurrency={insights.dailyIncomeByCurrency}
          currencyRankings={currencyRankings}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium">{t("consolidatedTitle")}</h3>
        <PreviousMonthsSummary
          previousMonthsByCurrency={insights.previousMonthsByCurrency}
          currencyRankings={currencyRankings}
        />
      </div>
    </section>
  );
}
