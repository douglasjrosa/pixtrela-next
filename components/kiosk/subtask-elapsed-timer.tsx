"use client";

import { useTranslations } from "next-intl";

import type { ProductiveWindowDto } from "@/lib/domain/workday-coverage";
import { formatDurationHms } from "@/lib/format/duration";
import { cn } from "@/lib/utils";

import { useElapsedSeconds } from "./use-elapsed-seconds";

export interface SubtaskElapsedTimerProps {
  startedAt: string | null;
  baseSeconds?: number;
  expectedTime?: number;
  paused?: boolean;
  productiveWindows?: readonly ProductiveWindowDto[];
}

export function SubtaskElapsedTimer({
  startedAt,
  baseSeconds = 0,
  expectedTime = 0,
  paused = false,
  productiveWindows,
}: SubtaskElapsedTimerProps) {
  const t = useTranslations("duration");
  const elapsedSeconds = useElapsedSeconds(
    startedAt,
    baseSeconds,
    paused,
    productiveWindows,
  );
  if (elapsedSeconds === null) return null;

  const isOverExpected =
    expectedTime > 0 && elapsedSeconds > expectedTime;

  return (
    <span
      suppressHydrationWarning
      className={cn(
        isOverExpected && "font-semibold text-destructive",
      )}
    >
      {formatDurationHms(elapsedSeconds, (key, values) => t(key, values))}
    </span>
  );
}
