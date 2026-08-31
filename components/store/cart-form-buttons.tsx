"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export type CartQtyButtonAction = "increase" | "decrease";

export function CartQtyButton({
  action,
  disabled = false,
  onClick,
}: {
  action: CartQtyButtonAction;
  disabled?: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("common");
  const isIncrease = action === "increase";
  const Icon = isIncrease ? Plus : Minus;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className="min-h-10 min-w-10 rounded-xl px-0"
      aria-label={isIncrease ? t("increaseValue") : t("decreaseValue")}
      onClick={onClick}
    >
      <Icon className="size-5" strokeWidth={2.5} aria-hidden />
    </Button>
  );
}
