"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export interface StarBalanceDetailsProps {
  balance: number;
  previousBalance: number;
  totalIncome: number;
  totalOutcome: number;
}

export function StarBalanceDetails({
  balance,
  previousBalance,
  totalIncome,
  totalOutcome,
}: StarBalanceDetailsProps) {
  const t = useTranslations("balance");
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        className="w-full text-sm"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? t("hideDetails") : t("viewDetails")}
      </Button>
      {open ? (
        <dl className="grid grid-cols-2 gap-2 rounded-2xl border bg-card p-4 text-sm">
          <dt>{t("previous")}</dt>
          <dd data-testid="previous" className="text-right tabular-nums">
            {previousBalance}
          </dd>
          <dt>{t("income")}</dt>
          <dd data-testid="income" className="text-right tabular-nums">
            {totalIncome}
          </dd>
          <dt>{t("outcome")}</dt>
          <dd data-testid="outcome" className="text-right tabular-nums">
            {totalOutcome}
          </dd>
          <dt>{t("current")}</dt>
          <dd data-testid="current" className="text-right font-semibold tabular-nums">
            {balance}
          </dd>
        </dl>
      ) : null}
    </div>
  );
}
