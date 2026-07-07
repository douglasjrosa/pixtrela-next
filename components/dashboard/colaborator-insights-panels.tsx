import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDatePtBr } from "@/lib/format/datetime";
import type {
  ColaboratorInsightsData,
  CurrencyRanking,
  DailyIncomeByCurrency,
} from "@/lib/dashboard/types";

function resolveCurrencyTitle(
  currencyId: number,
  rankings: CurrencyRanking[],
): string {
  const currency = rankings.find((entry) => entry.id === currencyId);
  return currency?.pluralTitle || currency?.title || String(currencyId);
}

export interface DailyIncomeTableProps {
  dailyIncomeByCurrency: DailyIncomeByCurrency[];
  currencyRankings: CurrencyRanking[];
}

export function DailyIncomeTable({
  dailyIncomeByCurrency,
  currencyRankings,
}: DailyIncomeTableProps) {
  const t = useTranslations("dashboard");

  if (dailyIncomeByCurrency.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("dailyEmpty")}</p>;
  }

  return (
    <div className="space-y-4">
      {dailyIncomeByCurrency.map((currencyIncome) => {
        const hasIncome = currencyIncome.days.some((day) => day.amount > 0);
        if (!hasIncome) return null;

        return (
          <Card key={currencyIncome.currencyId}>
            <CardHeader>
              <CardTitle className="text-base">
                {resolveCurrencyTitle(currencyIncome.currencyId, currencyRankings)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">{t("day")}</th>
                    <th className="py-2">{t("earned")}</th>
                  </tr>
                </thead>
                <tbody>
                  {currencyIncome.days
                    .filter((day) => day.amount > 0)
                    .map((day) => (
                      <tr key={day.date} className="border-b">
                        <td className="py-2 pr-4">{formatDatePtBr(day.date)}</td>
                        <td className="py-2">{day.amount}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export interface PreviousMonthsSummaryProps {
  previousMonthsByCurrency: ColaboratorInsightsData["previousMonthsByCurrency"];
  currencyRankings: CurrencyRanking[];
}

export function PreviousMonthsSummary({
  previousMonthsByCurrency,
  currencyRankings,
}: PreviousMonthsSummaryProps) {
  const t = useTranslations("dashboard");

  if (previousMonthsByCurrency.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("consolidatedEmpty")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {previousMonthsByCurrency.map((currencySummary) => (
        <Card key={currencySummary.currencyId}>
          <CardHeader>
            <CardTitle className="text-base">
              {resolveCurrencyTitle(currencySummary.currencyId, currencyRankings)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">{t("month")}</th>
                  <th className="py-2 pr-4">{t("income")}</th>
                  <th className="py-2 pr-4">{t("outcome")}</th>
                  <th className="py-2">{t("net")}</th>
                </tr>
              </thead>
              <tbody>
                {currencySummary.months.map((month) => (
                  <tr key={month.month} className="border-b">
                    <td className="py-2 pr-4">{formatDatePtBr(month.month)}</td>
                    <td className="py-2 pr-4">{month.totalIncome}</td>
                    <td className="py-2 pr-4">{month.totalOutcome}</td>
                    <td className="py-2">{month.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
