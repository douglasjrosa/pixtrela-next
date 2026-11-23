"use client";

import { useEffect, useState } from "react";

import { elapsedSecondsSince } from "@/lib/format/datetime";
import {
  fromProductiveWindowDtos,
  productiveSecondsFromWindows,
  type ProductiveWindowDto,
} from "@/lib/domain/workday-coverage";

const TICK_MS = 1000;

function usableStartMs(startedAt: string, nowMs: number): number | null {
  const startedMs = Date.parse(startedAt);
  if (Number.isNaN(startedMs) || startedMs > nowMs) return null;
  return startedMs;
}

function liveSeconds(
  startedIso: string,
  nowMs: number,
  windows?: readonly ProductiveWindowDto[],
): number {
  if (!windows) return elapsedSecondsSince(startedIso, nowMs);
  return productiveSecondsFromWindows(
    Date.parse(startedIso),
    nowMs,
    fromProductiveWindowDtos(windows),
  );
}

export function useElapsedSeconds(
  startedAt: string | null,
  baseSeconds = 0,
  paused = false,
  windows?: readonly ProductiveWindowDto[],
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
      liveSeconds(new Date(anchorMs).toISOString(), nowMs, windows)
    );
  }

  return baseSeconds + liveSeconds(startedAt, nowMs, windows);
}
