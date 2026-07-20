"use client";

import { useTranslations } from "next-intl";

import { daysUntilExchangeWindow } from "@/lib/colaborator/exchange-window-days";

export interface ExchangeWindowBannerProps {
  windowOpen: boolean;
  firstDay: number;
  lastDay: number;
}

export function ExchangeWindowBanner({
  windowOpen,
  firstDay,
  lastDay,
}: ExchangeWindowBannerProps) {
  const t = useTranslations("exchange");

  if (windowOpen) {
    return (
      <p role="status" className="rounded-2xl bg-[var(--star-gold-muted)] px-4 py-3 text-sm font-medium">
        {t("windowOpen")}
      </p>
    );
  }

  const days = daysUntilExchangeWindow(firstDay, lastDay);
  return (
    <div role="alert" className="space-y-1 rounded-2xl border border-destructive/40 bg-card px-4 py-3">
      <p className="text-sm text-destructive">
        {t("windowClosed", { first: firstDay, last: lastDay })}
      </p>
      {days > 0 ? (
        <p className="text-sm font-medium">{t("daysRemaining", { days })}</p>
      ) : null}
    </div>
  );
}
