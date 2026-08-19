"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function CartQtySubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      className="min-h-10 min-w-10 rounded-xl px-0"
      aria-label={label}
    >
      {label}
    </Button>
  );
}

export function CartRemoveSubmitButton() {
  const t = useTranslations("cart");
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-destructive"
    >
      {t("remove")}
    </Button>
  );
}

export function CartCheckoutSubmitButton({ disabled }: { disabled: boolean }) {
  const t = useTranslations("cart");
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className={
        "min-h-12 w-full rounded-2xl font-bold " +
        "bg-star-gold text-star-gold-foreground hover:bg-star-gold/90"
      }
    >
      {t("checkout")}
    </Button>
  );
}
