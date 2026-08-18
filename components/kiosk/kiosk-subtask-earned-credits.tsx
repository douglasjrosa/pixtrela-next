"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

export interface KioskSubtaskEarnedCreditsProps {
  amount: number;
}

/** Compact finished-card row: star icon then earned currency, right-aligned. */
export function KioskSubtaskEarnedCredits({
  amount,
}: KioskSubtaskEarnedCreditsProps) {
  const t = useTranslations("kiosk");
  const count = Math.max(0, Math.trunc(amount));

  return (
    <p
      className="flex justify-end"
      aria-label={t("earnedCredits", { count })}
      data-testid="kiosk-earned-credits"
    >
      <span className="inline-flex items-center gap-1.5 text-base font-semibold tabular-nums">
        <Star className="size-5 shrink-0 fill-current" aria-hidden />
        {count}
      </span>
    </p>
  );
}
