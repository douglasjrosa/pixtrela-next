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
