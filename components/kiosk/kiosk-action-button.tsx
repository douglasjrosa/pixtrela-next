"use client";

import type { ButtonHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type KioskActionVariant = "primary" | "produce" | "outline";

export interface KioskActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  actionVariant?: KioskActionVariant;
}

const VARIANT_CLASS: Record<KioskActionVariant, string> = {
  /** Relies on Button default (`bg-primary`). */
  primary: "",
  produce: "bg-[var(--success)] text-white hover:bg-[var(--success)]/90",
  outline: "border-2 bg-card",
};

export function KioskActionButton({
  actionVariant = "primary",
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
