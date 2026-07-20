"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ExchangeButtonProps {
  windowOpen: boolean;
  affordable: boolean;
  onRedeem?: () => void;
}

/**
 * Redeem button that is disabled when the exchange window is closed or the
 * colaborator cannot afford the award.
 */
export function ExchangeButton({
  windowOpen,
  affordable,
  onRedeem,
}: ExchangeButtonProps) {
  const t = useTranslations("exchange");
  const disabled = !windowOpen || !affordable;

  return (
    <Button
      type="button"
      disabled={disabled}
      onClick={onRedeem}
      className={cn(
        "min-h-12 w-full rounded-2xl font-bold",
        !disabled &&
          "bg-[var(--star-gold)] text-[var(--star-gold-foreground)] hover:bg-[var(--star-gold)]/90",
      )}
    >
      {t("redeem")}
    </Button>
  );
}
