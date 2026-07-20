"use client";

import type { ButtonHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type KioskActionVariant = "gold" | "produce" | "outline";

export interface KioskActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  actionVariant?: KioskActionVariant;
}

const VARIANT_CLASS: Record<KioskActionVariant, string> = {
  gold:
    "bg-[var(--star-gold)] text-[var(--star-gold-foreground)] hover:bg-[var(--star-gold)]/90",
  produce: "bg-[var(--success)] text-white hover:bg-[var(--success)]/90",
  outline: "border-2 bg-card",
};

export function KioskActionButton({
  actionVariant = "gold",
  className,
  type = "button",
  ...props
}: KioskActionButtonProps) {
  return (
    <Button
      type={type}
      variant={actionVariant === "outline" ? "outline" : "default"}
      className={cn(
        "min-h-14 w-full rounded-2xl px-8 py-6 text-lg font-bold active:scale-[0.98]",
        VARIANT_CLASS[actionVariant],
        className,
      )}
      {...props}
    />
  );
}
