"use client";

import { useEffect, useState } from "react";

import { elapsedSecondsSince } from "@/lib/format/datetime";

const TICK_MS = 1000;

function usableStartMs(startedAt: string, nowMs: number): number | null {
  const startedMs = Date.parse(startedAt);
  if (Number.isNaN(startedMs) || startedMs > nowMs) return null;
  return startedMs;
}

export function useElapsedSeconds(
  startedAt: string | null,
  baseSeconds = 0,
  paused = false,
): number | null {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [anchoredStartMs, setAnchoredStartMs] = useState<number | null>(null);
  const [prevStartedAt, setPrevStartedAt] = useState(startedAt);
  const [prevPaused, setPrevPaused] = useState(paused);

  if (startedAt !== prevStartedAt || paused !== prevPaused) {
    setPrevStartedAt(startedAt);
    setPrevPaused(paused);
    setAnchoredStartMs(null);
  }

  useEffect(() => {
    const syncNow = () => setNowMs(Date.now());
    syncNow();
    if (!startedAt || paused) return undefined;
    const id = window.setInterval(syncNow, TICK_MS);
    return () => window.clearInterval(id);
  }, [startedAt, paused]);

  if (!startedAt) return null;
  if (nowMs === null) return baseSeconds;

  const startedMs = usableStartMs(startedAt, nowMs);
  if (startedMs === null) {
    const anchorMs = anchoredStartMs ?? nowMs;
    if (anchoredStartMs === null) {
      setAnchoredStartMs(nowMs);
    }
    return (
      baseSeconds +
      elapsedSecondsSince(new Date(anchorMs).toISOString(), nowMs)
    );
  }

  return baseSeconds + elapsedSecondsSince(startedAt, nowMs);
}
