"use client";

import { useTranslations } from "next-intl";

import { formatDurationHms } from "@/lib/format/duration";
import { cn } from "@/lib/utils";

import { useElapsedSeconds } from "./use-elapsed-seconds";

export interface SubtaskElapsedTimerProps {
  startedAt: string | null;
  baseSeconds?: number;
  expectedTime?: number;
}

export function SubtaskElapsedTimer({
  startedAt,
  baseSeconds = 0,
  expectedTime = 0,
}: SubtaskElapsedTimerProps) {
  const t = useTranslations("duration");
  const elapsedSeconds = useElapsedSeconds(startedAt, baseSeconds);
  if (elapsedSeconds === null) return null;

  const isOverExpected =
    expectedTime > 0 && elapsedSeconds > expectedTime;

  return (
    <span
      className={cn(
        isOverExpected && "font-semibold text-destructive",
      )}
    >
      {formatDurationHms(elapsedSeconds, (key, values) => t(key, values))}
    </span>
  );
}
