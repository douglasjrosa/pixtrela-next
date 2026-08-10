"use client";

import { useState, useSyncExternalStore } from "react";

const TICK_INTERVAL_MS = 1000;

let cachedNowMs = 0;
let listenerCount = 0;
let timerId: number | null = null;
const listeners = new Set<() => void>();

function emitClockTick(): void {
  cachedNowMs = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribeToClock(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  listenerCount += 1;
  if (listenerCount === 1) {
    cachedNowMs = Date.now();
    timerId = window.setInterval(emitClockTick, TICK_INTERVAL_MS);
  }
  return () => {
    listeners.delete(onStoreChange);
    listenerCount -= 1;
    if (listenerCount === 0 && timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };
}

function getClockSnapshot(): number {
  return cachedNowMs;
}

const DISABLED_CLOCK_SNAPSHOT = 0;

function subscribeDisabled(): () => void {
  return () => {};
}

function getDisabledClockSnapshot(): number {
  return DISABLED_CLOCK_SNAPSHOT;
}

function getServerClockSnapshot(initialNowMs?: number): number {
  return initialNowMs ?? 0;
}

/**
 * Wall-clock ticker for live progress. Pair with resolveLiveTimeSpent /
 * resolveOpenSessionsElapsedSeconds so n parallel opens advance at n× rate.
 */
export function useLiveProgressClock(
  enabled: boolean,
  initialNowMs?: number,
): number {
  const liveNowMs = useSyncExternalStore(
    enabled ? subscribeToClock : subscribeDisabled,
    enabled ? getClockSnapshot : getDisabledClockSnapshot,
    () => getServerClockSnapshot(initialNowMs),
  );
  const [prevInitialNowMs, setPrevInitialNowMs] = useState(initialNowMs);
  const [frozenNowMs, setFrozenNowMs] = useState(initialNowMs ?? 0);
  if (!enabled && initialNowMs !== prevInitialNowMs) {
    setPrevInitialNowMs(initialNowMs);
    if (initialNowMs !== undefined) {
      setFrozenNowMs(initialNowMs);
    }
  }

  return enabled ? liveNowMs : frozenNowMs;
}
