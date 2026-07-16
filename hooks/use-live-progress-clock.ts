"use client";

import { useEffect, useState } from "react";

const TICK_INTERVAL_MS = 1000;

/**
 * Wall-clock ticker for live progress. Pair with resolveLiveTimeSpent /
 * resolveOpenSessionsElapsedSeconds so n parallel opens advance at n× rate.
 */
export function useLiveProgressClock(
  enabled: boolean,
  initialNowMs?: number,
): number {
  const [nowMs, setNowMs] = useState(initialNowMs ?? Date.now());

  useEffect(() => {
    if (!enabled) {
      if (initialNowMs !== undefined) setNowMs(initialNowMs);
      return;
    }

    setNowMs(Date.now());
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, [enabled, initialNowMs]);

  return nowMs;
}
