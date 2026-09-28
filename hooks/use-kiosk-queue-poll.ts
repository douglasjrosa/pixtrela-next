"use client";

import { useEffect, useRef } from "react";

import { isBrowserTabVisible } from "@/lib/browser/is-browser-tab-visible";
import { KIOSK_QUEUE_POLL_MS } from "@/lib/kiosk/kiosk-queue-poll-interval";

export type KioskQueuePollFn = () => void | Promise<void>;

/**
 * Polls kiosk queue data without router.refresh. Pauses while hidden or
 * `paused` (e.g. optimistic start/exit).
 */
export function useKioskQueuePoll(
  onPoll: KioskQueuePollFn,
  paused = false,
): void {
  const onPollRef = useRef(onPoll);

  useEffect(() => {
    onPollRef.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | undefined;
    let inFlight = false;

    function stopInterval(): void {
      if (timerId === undefined) return;
      window.clearInterval(timerId);
      timerId = undefined;
    }

    async function runPoll(): Promise<void> {
      if (paused || inFlight || !isBrowserTabVisible()) return;

      inFlight = true;
      try {
        await onPollRef.current();
        if (cancelled) return;
      } catch {
        // Keep last snapshot; next interval retries.
      } finally {
        inFlight = false;
      }
    }

    function schedule(): void {
      stopInterval();
      if (paused || !isBrowserTabVisible()) return;
      timerId = window.setInterval(() => {
        if (!isBrowserTabVisible()) {
          stopInterval();
          return;
        }
        void runPoll();
      }, KIOSK_QUEUE_POLL_MS);
    }

    function onVisibility(): void {
      if (!isBrowserTabVisible()) {
        stopInterval();
        return;
      }
      void runPoll();
      if (timerId === undefined) schedule();
    }

    if (!paused && isBrowserTabVisible()) {
      void runPoll();
      schedule();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [paused]);
}
