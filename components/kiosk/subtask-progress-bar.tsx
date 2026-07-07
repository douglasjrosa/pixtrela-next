"use client";

import { useTranslations } from "next-intl";

import {
  isOverExpected,
  resolveProgressPercent,
} from "@/lib/business/subtask-progress";
import { cn } from "@/lib/utils";

export interface SubtaskProgressBarProps {
  elapsedSeconds: number;
  expectedSeconds: number;
}

export function SubtaskProgressBar({
  elapsedSeconds,
  expectedSeconds,
}: SubtaskProgressBarProps) {
  const t = useTranslations("kiosk");

  if (expectedSeconds <= 0) return null;

  const percent = resolveProgressPercent(elapsedSeconds, expectedSeconds);
  const overExpected = isOverExpected(elapsedSeconds, expectedSeconds);

  return (
    <div className="space-y-1">
      <div
        aria-label={t("progressTowardExpected")}
        aria-valuemax={expectedSeconds}
        aria-valuemin={0}
        aria-valuenow={Math.min(elapsedSeconds, expectedSeconds)}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
      >
        <div
          className={cn(
            "h-full transition-[width] duration-1000 ease-linear",
            overExpected ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
