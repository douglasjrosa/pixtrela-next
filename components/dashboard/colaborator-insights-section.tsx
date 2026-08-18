import { useTranslations } from "next-intl";

import { ColaboratorDailyGain } from "@/components/colaborator/colaborator-daily-gain";
import type { BalanceCurrencyOption } from "@/components/dashboard/balance-adjustment-modal";
import type { BalanceAdjustmentResult } from "@/app/(app)/balance-adjustment-actions";
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
  balanceCurrencyOptions?: BalanceCurrencyOption[];
  defaultBalanceCurrencyId?: string | null;
  onAdjustBalance?: (input: {
    colaboratorDocumentId: string;
    date: string;
    currencyId: string;
    amount: number;
  }) => Promise<BalanceAdjustmentResult>;
}

export function ColaboratorInsightsSection({
  mode,
  role,
  colaboratorOptions,
  selectedDocumentId,
  selectedName,
  insights,
  currencyRankings,
  balanceCurrencyOptions = [],
  defaultBalanceCurrencyId = null,
  onAdjustBalance,
}: ColaboratorInsightsSectionProps) {
  const t = useTranslations("dashboard");

  if (mode === "self") {
    return (
      <ColaboratorDailyGain
        insights={insights}
        currencyRankings={currencyRankings}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("insightsTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("insightsDescription")}</p>
      </div>

      {role !== "colaborator" ? (
        <ColaboratorPicker
          options={colaboratorOptions}
          selectedDocumentId={selectedDocumentId}
          role={role}
          currencyOptions={balanceCurrencyOptions}
          defaultCurrencyId={defaultBalanceCurrencyId}
          onAdjustBalance={onAdjustBalance}
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
