import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface CurrencyBalanceProps {
  balance: number;
  previousBalance: number;
  totalIncome: number;
  totalOutcome: number;
  /** Display name of the currency unit (e.g. Estrelas). */
  currencyLabel?: string;
}

export function CurrencyBalance({
  balance,
  previousBalance,
  totalIncome,
  totalOutcome,
  currencyLabel,
}: CurrencyBalanceProps) {
  const t = useTranslations("balance");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {balance} {currencyLabel ?? t("stars")}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-sm">
        <span>{t("previous")}</span>
        <span data-testid="previous">{previousBalance}</span>
        <span>{t("income")}</span>
        <span data-testid="income">{totalIncome}</span>
        <span>{t("outcome")}</span>
        <span data-testid="outcome">{totalOutcome}</span>
        <span>{t("current")}</span>
        <span data-testid="current">{balance}</span>
      </CardContent>
    </Card>
  );
}
