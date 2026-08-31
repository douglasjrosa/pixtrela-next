"use client";

import { useTranslations } from "next-intl";

import type { ExchangeWindowPhase } from "@/lib/domain/exchange";

export interface StoreWindowInfoCardProps {
  windowPhase: ExchangeWindowPhase;
  firstDay: number;
  lastDay: number;
}

export function StoreWindowInfoCard({
  windowPhase,
  firstDay,
  lastDay,
}: StoreWindowInfoCardProps) {
  const tExchange = useTranslations("exchange");
  const tCart = useTranslations("cart");

  if (windowPhase === "open") {
    return (
      <div
        role="status"
        className="space-y-2 rounded-2xl bg-[var(--star-gold-muted)] px-4 py-3 text-sm"
      >
        <p className="font-medium">{tExchange("windowOpen")}</p>
        <p>{tCart("autoCloseBanner", { lastDay })}</p>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={
        "space-y-2 rounded-2xl border border-destructive/40 bg-card px-4 py-3"
      }
    >
      <p className="text-sm text-destructive">
        {tExchange("windowClosed", { first: firstDay, last: lastDay })}
      </p>
      <p className="text-sm">
        {windowPhase === "before_open"
          ? tCart("readOnlyNotYetOpen")
          : tCart("readOnlyClosed")}
      </p>
    </div>
  );
}
