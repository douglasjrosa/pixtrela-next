"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

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
    <Button type="button" disabled={disabled} onClick={onRedeem}>
      {t("redeem")}
    </Button>
  );
}
