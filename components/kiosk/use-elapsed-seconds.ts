"use client";

import { useEffect, useState } from "react";

import { elapsedSecondsSince } from "@/lib/format/datetime";

const TICK_MS = 1000;

export function useElapsedSeconds(
  startedAt: string | null,
  baseSeconds = 0,
  paused = false,
): number | null {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || paused) return undefined;
    const id = window.setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [startedAt, paused]);

  if (!startedAt) return null;

  return baseSeconds + elapsedSecondsSince(startedAt, nowMs);
}
