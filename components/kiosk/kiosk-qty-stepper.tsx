"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function clampQty(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface KioskQtyStepperProps {
  id: string;
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  className?: string;
  onChange: (value: number) => void;
}

export function KioskQtyStepper({
  id,
  value,
  min = 0,
  max,
  disabled = false,
  className,
  onChange,
}: KioskQtyStepperProps) {
  const t = useTranslations("kiosk");
  const safeMax = Math.max(min, max);
  const clampedValue = clampQty(value, min, safeMax);
  const [text, setText] = useState(String(clampedValue));
  const valueKey = `${value}:${min}:${safeMax}`;
  const [syncedKey, setSyncedKey] = useState(valueKey);
  if (syncedKey !== valueKey) {
    setSyncedKey(valueKey);
    setText(String(clampedValue));
  }

  function commitText(raw: string): void {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isInteger(parsed)) {
      setText(String(clampedValue));
      return;
    }
    const next = clampQty(parsed, min, safeMax);
    setText(String(next));
    onChange(next);
  }

  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        className="h-14 w-14 shrink-0 rounded-2xl text-xl"
        disabled={disabled || clampedValue <= min}
        aria-label={t("exitQtyDecrease")}
        onClick={() => onChange(clampQty(clampedValue - 1, min, safeMax))}
      >
        <Minus className="size-6" aria-hidden />
      </Button>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={safeMax}
        value={text}
        disabled={disabled}
        className={cn(
          "h-14 flex-1 rounded-2xl text-center text-lg",
          "[appearance:textfield]",
          "[&::-webkit-inner-spin-button]:appearance-none",
          "[&::-webkit-outer-spin-button]:appearance-none",
        )}
        onChange={(event) => {
          const raw = event.target.value;
          const parsed = Number.parseInt(raw, 10);
          if (!Number.isInteger(parsed)) {
            setText(raw);
            return;
          }
          const next = clampQty(parsed, min, safeMax);
          setText(String(next));
          onChange(next);
        }}
        onBlur={() => commitText(text)}
      />
      <Button
        type="button"
        variant="outline"
        className="h-14 w-14 shrink-0 rounded-2xl text-xl"
        disabled={disabled || clampedValue >= safeMax}
        aria-label={t("exitQtyIncrease")}
        onClick={() => onChange(clampQty(clampedValue + 1, min, safeMax))}
      >
        <Plus className="size-6" aria-hidden />
      </Button>
    </div>
  );
}
