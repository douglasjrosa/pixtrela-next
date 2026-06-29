import {
  DEFAULT_KIOSK_SESSION_IDLE_SECONDS,
  KIOSK_IDLE_MS,
  MAX_KIOSK_SESSION_IDLE_SECONDS,
  MIN_KIOSK_SESSION_IDLE_SECONDS,
  kioskSessionIdleSecondsToMs,
  normalizeKioskSessionIdleSeconds,
} from "./kiosk-session-idle";

export const KIOSK_IDLE_TICK_MS = 50;

export type IdleCallback = () => void;
export type IdleProgressCallback = (progress: number) => void;

export function computeIdleProgress(
  deadlineMs: number,
  nowMs: number,
  durationMs: number,
): number {
  const remaining = deadlineMs - nowMs;
  if (remaining <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - remaining / durationMs));
}

export function createKioskIdleController(options: {
  durationMs: number;
  onIdle: IdleCallback;
  onProgress?: IdleProgressCallback;
  tickMs?: number;
}): { reset: () => void; clear: () => void } {
  const { durationMs, onIdle, onProgress, tickMs = KIOSK_IDLE_TICK_MS } = options;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  let deadlineMs = 0;

  function clear(): void {
    if (idleTimer) clearTimeout(idleTimer);
    if (tickTimer) clearInterval(tickTimer);
    idleTimer = null;
    tickTimer = null;
  }

  function emitProgress(nowMs = Date.now()): void {
    if (!onProgress || deadlineMs === 0) return;
    onProgress(computeIdleProgress(deadlineMs, nowMs, durationMs));
  }

  function reset(): void {
    clear();
    deadlineMs = Date.now() + durationMs;
    onProgress?.(0);
    idleTimer = setTimeout(() => {
      clear();
      onProgress?.(1);
      onIdle();
    }, durationMs);
    tickTimer = setInterval(() => emitProgress(), tickMs);
  }

  return { reset, clear };
}

export {
  DEFAULT_KIOSK_SESSION_IDLE_SECONDS,
  KIOSK_IDLE_MS,
  MAX_KIOSK_SESSION_IDLE_SECONDS,
  MIN_KIOSK_SESSION_IDLE_SECONDS,
  kioskSessionIdleSecondsToMs,
  normalizeKioskSessionIdleSeconds,
};

/** @deprecated Use createKioskIdleController */
export function createKioskIdleTimer(onIdle: IdleCallback): {
  reset: () => void;
  clear: () => void;
} {
  return createKioskIdleController({
    durationMs: kioskSessionIdleSecondsToMs(DEFAULT_KIOSK_SESSION_IDLE_SECONDS),
    onIdle,
  });
}
