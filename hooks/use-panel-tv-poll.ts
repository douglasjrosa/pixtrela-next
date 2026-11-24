"use client";

import { useEffect, useRef } from "react";

import { isBrowserTabVisible } from "@/lib/browser/is-browser-tab-visible";
import { PANEL_TV_POLL_MS } from "@/lib/panels/panel-tv-poll-interval";

export type PanelTvPollFn = () => void | Promise<void>;

/** Polls live TV fulfillment. Pauses while the tab is hidden. */
export function usePanelTvPoll(onPoll: PanelTvPollFn): void {
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
      if (inFlight || !isBrowserTabVisible()) return;
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
      if (!isBrowserTabVisible()) return;
      timerId = window.setInterval(() => {
        if (!isBrowserTabVisible()) {
          stopInterval();
          return;
        }
        void runPoll();
      }, PANEL_TV_POLL_MS);
    }

    function onVisibility(): void {
      if (!isBrowserTabVisible()) {
        stopInterval();
        return;
      }
      void runPoll();
      if (timerId === undefined) schedule();
    }

    if (isBrowserTabVisible()) {
      void runPoll();
      schedule();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
