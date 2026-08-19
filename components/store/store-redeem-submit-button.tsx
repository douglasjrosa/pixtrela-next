"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StoreRedeemSubmitButtonProps {
  windowOpen: boolean;
  affordable: boolean;
  inStock: boolean;
}

export function StoreRedeemSubmitButton({
  windowOpen,
  affordable,
  inStock,
}: StoreRedeemSubmitButtonProps) {
  const t = useTranslations("exchange");
  const { pending } = useFormStatus();
  const disabled = !windowOpen || !affordable || !inStock || pending;

  return (
    <Button
      type="submit"
      disabled={disabled}
      className={cn(
        "min-h-12 w-full rounded-2xl font-bold",
        !disabled &&
          "bg-star-gold text-star-gold-foreground hover:bg-star-gold/90",
      )}
    >
      {t("redeem")}
    </Button>
  );
}
