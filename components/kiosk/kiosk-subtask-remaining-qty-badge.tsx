"use client";

import { useTranslations } from "next-intl";

import { CardBadge } from "@/components/ui/card";

export interface KioskSubtaskRemainingQtyBadgeProps {
  remainingQty: number;
}

export function KioskSubtaskRemainingQtyBadge({
  remainingQty,
}: KioskSubtaskRemainingQtyBadgeProps) {
  const t = useTranslations("kiosk");

  if (remainingQty <= 0) return null;

  return (
    <CardBadge className="w-fit text-xs font-medium">
      {t("remainingQty", { count: remainingQty })}
    </CardBadge>
  );
}
