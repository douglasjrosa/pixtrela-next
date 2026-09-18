"use client";

import type { ButtonHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type KioskActionVariant =
  | "primary"
  | "produce"
  | "outline"
  | "dangerOutline"
  | "dangerOutlineActive"
  | "successOutline"
  | "successOutlineActive";

export interface KioskActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  actionVariant?: KioskActionVariant;
}

const OUTLINE_VARIANTS = new Set<KioskActionVariant>([
  "outline",
  "dangerOutline",
  "dangerOutlineActive",
  "successOutline",
  "successOutlineActive",
]);

const VARIANT_CLASS: Record<KioskActionVariant, string> = {
  /** Relies on Button default (`bg-primary`). */
  primary: "",
  produce: "bg-success text-success-foreground hover:bg-success/90",
  outline: "border-2 bg-card",
  dangerOutline:
    "border-2 border-destructive bg-card text-destructive hover:bg-destructive/10",
  dangerOutlineActive:
    "border-2 border-destructive bg-destructive/15 text-destructive",
  successOutline:
    "border-2 border-success bg-card text-success hover:bg-success/10",
  successOutlineActive:
    "border-2 border-success bg-success/15 text-success",
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
      variant={OUTLINE_VARIANTS.has(actionVariant) ? "outline" : "default"}
      className={cn(
        "min-h-14 w-full rounded-2xl px-8 py-6 text-lg font-bold active:scale-[0.98]",
        VARIANT_CLASS[actionVariant],
        className,
      )}
      {...props}
    />
  );
}
