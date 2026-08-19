"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StoreAddToCartSubmitButtonProps {
  inStock: boolean;
  hasCost: boolean;
  compact?: boolean;
}

export function StoreAddToCartSubmitButton({
  inStock,
  hasCost,
  compact = false,
}: StoreAddToCartSubmitButtonProps) {
  const t = useTranslations("store");
  const { pending } = useFormStatus();
  const disabled = !inStock || !hasCost || pending;

  return (
    <Button
      type="submit"
      disabled={disabled}
      size={compact ? "sm" : "default"}
      className={cn(
        "w-full rounded-2xl font-bold",
        compact ? "min-h-10 text-sm" : "min-h-12",
        !disabled &&
          "bg-star-gold text-star-gold-foreground hover:bg-star-gold/90",
      )}
    >
      {t("addToCart")}
    </Button>
  );
}
