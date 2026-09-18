"use client";

import { useEffect, useState } from "react";

import { elapsedSecondsSince } from "@/lib/format/datetime";

const TICK_MS = 1000;

export function useElapsedSeconds(
  startedAt: string | null,
  baseSeconds = 0,
  paused = false,
): number | null {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const syncNow = () => setNowMs(Date.now());
    syncNow();
    if (!startedAt || paused) return undefined;
    const id = window.setInterval(syncNow, TICK_MS);
    return () => window.clearInterval(id);
  }, [startedAt, paused]);

  if (!startedAt) return null;
  if (nowMs === null) return baseSeconds;

  return baseSeconds + elapsedSecondsSince(startedAt, nowMs);
}
