"use client";

import { useEffect, useRef } from "react";

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

    async function runPoll(): Promise<void> {
      if (paused || inFlight) return;
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }

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
      timerId = window.setInterval(() => {
        void runPoll();
      }, KIOSK_QUEUE_POLL_MS);
    }

    function onVisibility(): void {
      if (document.visibilityState === "visible") {
        void runPoll();
      }
    }

    if (!paused) {
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
