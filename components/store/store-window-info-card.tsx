"use client";

import { useTranslations } from "next-intl";

export interface StoreWindowInfoCardProps {
  windowOpen: boolean;
  firstDay: number;
  lastDay: number;
}

export function StoreWindowInfoCard({
  windowOpen,
  firstDay,
  lastDay,
}: StoreWindowInfoCardProps) {
  const tExchange = useTranslations("exchange");
  const tCart = useTranslations("cart");

  if (windowOpen) {
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
      <p className="text-sm">{tCart("readOnlyClosed")}</p>
    </div>
  );
}
