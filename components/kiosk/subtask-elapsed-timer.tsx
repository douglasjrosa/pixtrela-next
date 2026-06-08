"use client";

import { useElapsedTime } from "./use-elapsed-time";

export interface SubtaskElapsedTimerProps {
  startedAt: string | null;
  baseSeconds?: number;
}

export function SubtaskElapsedTimer({
  startedAt,
  baseSeconds = 0,
}: SubtaskElapsedTimerProps) {
  const elapsed = useElapsedTime(startedAt, baseSeconds);
  if (!elapsed) return null;
  return <span className="font-mono tabular-nums">{elapsed}</span>;
}
