"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function CartQtyButton({
  label,
  disabled = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className="min-h-10 min-w-10 rounded-xl px-0"
      aria-label={label}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function CartRemoveButton({
  disabled = false,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("cart");
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      className="min-h-10 min-w-10 rounded-xl text-destructive hover:text-destructive"
      aria-label={t("remove")}
      onClick={onClick}
    >
      <Trash2 className="size-4" aria-hidden />
    </Button>
  );
}
