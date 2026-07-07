import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDatePtBr } from "@/lib/format/datetime";
import type { CurrencyRanking } from "@/lib/dashboard/types";

export interface MonthlyRankingPanelProps {
  month: string;
  currencies: CurrencyRanking[];
}

export function MonthlyRankingPanel({
  month,
  currencies,
}: MonthlyRankingPanelProps) {
  const t = useTranslations("dashboard");

  if (currencies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("rankingEmpty")}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("rankingTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("rankingMonth", { month: formatDatePtBr(month) })}
        </p>
      </div>
      {currencies.map((currency) => (
        <Card key={currency.id}>
          <CardHeader>
            <CardTitle>{currency.pluralTitle || currency.title}</CardTitle>
            <CardDescription>{t("rankingDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {currency.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("rankingEmpty")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">{t("position")}</th>
                    <th className="py-2 pr-4">{t("colaborator")}</th>
                    <th className="py-2">{t("earned")}</th>
                  </tr>
                </thead>
                <tbody>
                  {currency.rows.map((row) => (
                    <tr key={row.userDocumentId} className="border-b">
                      <td className="py-2 pr-4">{row.rank}</td>
                      <td className="py-2 pr-4">{row.name}</td>
                      <td className="py-2">{row.totalIncome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
