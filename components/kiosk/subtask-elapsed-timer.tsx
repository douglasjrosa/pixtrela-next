"use client";

import { useTranslations } from "next-intl";

import { formatDurationHms } from "@/lib/format/duration";

import { useElapsedSeconds } from "./use-elapsed-seconds";

export interface SubtaskElapsedTimerProps {
  startedAt: string | null;
  baseSeconds?: number;
}

export function SubtaskElapsedTimer({
  startedAt,
  baseSeconds = 0,
}: SubtaskElapsedTimerProps) {
  const t = useTranslations("duration");
  const elapsedSeconds = useElapsedSeconds(startedAt, baseSeconds);
  if (elapsedSeconds === null) return null;

  return (
    <span className="font-mono tabular-nums">
      {formatDurationHms(elapsedSeconds, (key, values) => t(key, values))}
    </span>
  );
}
