import { useTranslations } from "next-intl";

import type {
  ColaboratorInsightsData,
  CurrencyRanking,
  DailyIncomeByCurrency,
} from "@/lib/dashboard/types";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function sumTodayIncome(
  dailyIncomeByCurrency: DailyIncomeByCurrency[],
  today = todayIsoDate(),
): number {
  let total = 0;
  for (const currencyIncome of dailyIncomeByCurrency) {
    for (const day of currencyIncome.days) {
      if (day.date === today) {
        total += day.amount;
      }
    }
  }
  return total;
}

export interface ColaboratorDailyGainProps {
  insights: ColaboratorInsightsData;
  currencyRankings: CurrencyRanking[];
}

export function ColaboratorDailyGain({
  insights,
  currencyRankings,
}: ColaboratorDailyGainProps) {
  const t = useTranslations("dashboard");
  const todayGain = sumTodayIncome(insights.dailyIncomeByCurrency);
  const currencyLabel =
    currencyRankings[0]?.pluralTitle ||
    currencyRankings[0]?.title ||
    t("earned");

  return (
    <section className="space-y-2 rounded-2xl border bg-card p-4 text-center">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("todayGainTitle")}
      </h2>
      <p className="text-4xl font-bold tabular-nums text-[var(--star-gold-foreground)]">
        {todayGain}
      </p>
      <p className="text-sm text-muted-foreground">{currencyLabel}</p>
    </section>
  );
}
