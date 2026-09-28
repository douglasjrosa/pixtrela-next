"use client";

import { useEffect, useRef } from "react";

import { pollBoardRevision } from "@/app/(app)/board/poll-revision";
import { isBrowserTabVisible } from "@/lib/browser/is-browser-tab-visible";
import {
  hasBoardRevisionChanged,
  type BoardRevision,
} from "@/lib/board/board-revision";
import {
  BOARD_EVENTS_PATH,
  BOARD_INVALIDATE_EVENT,
  BOARD_REALTIME_TOKEN_PATH,
  trimEnv,
} from "@/lib/realtime/board-channel";

export const BOARD_REVISION_POLL_MS = 10_000;
export const BOARD_REVISION_SSE_FALLBACK_MS = 60_000;

export type SyncBoardStepsFn = () => Promise<void>;

type BoardRealtimeCredentials = {
  sseUrl: string;
  token: string;
};

function readPublicSseUrl(): string {
  return trimEnv(process.env.NEXT_PUBLIC_REALTIME_SSE_URL);
}

function buildBoardEventSourceUrl(sseUrl: string, token: string): string {
  const origin = sseUrl.replace(/\/$/, "");
  const query = new URLSearchParams({ token });
  return `${origin}${BOARD_EVENTS_PATH}?${query.toString()}`;
}

async function fetchBoardRealtimeCredentials(): Promise<BoardRealtimeCredentials | null> {
  const response = await fetch(BOARD_REALTIME_TOKEN_PATH, {
    credentials: "same-origin",
  });
  if (!response.ok) return null;

  const body = (await response.json()) as {
    sseUrl?: unknown;
    token?: unknown;
  };
  if (typeof body.sseUrl !== "string" || body.sseUrl.length === 0) return null;
  if (typeof body.token !== "string" || body.token.length === 0) return null;
  return { sseUrl: body.sseUrl, token: body.token };
}

/**
 * Polls board-wide revision. Structural step changes call `onStepsChanged`
 * (syncBoardSteps). Task layout is left to progress poll C — no router.refresh.
 * When the public SSE URL is set, `board-invalidate` runs the same check and
 * the interval slows while the stream is open.
 */
export function useBoardRevisionRefresh(
  paused = false,
  onStepsChanged?: SyncBoardStepsFn,
): void {
  const revisionRef = useRef<BoardRevision | null>(null);
  const onStepsChangedRef = useRef(onStepsChanged);

  useEffect(() => {
    onStepsChangedRef.current = onStepsChanged;
  }, [onStepsChanged]);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | undefined;
    let source: EventSource | null = null;
    let connecting = false;
    let pollMs = BOARD_REVISION_POLL_MS;

    async function checkRevision(): Promise<void> {
      if (paused || !isBrowserTabVisible()) return;

      try {
        const revision = await pollBoardRevision();
        if (cancelled) return;

        const previous = revisionRef.current;
        const stepsChanged =
          hasBoardRevisionChanged(previous, revision) &&
          previous != null &&
          previous.stepsMaxUpdatedAt !== revision.stepsMaxUpdatedAt;
        if (stepsChanged) {
          await onStepsChangedRef.current?.();
        }

        revisionRef.current = revision;
      } catch {
        // Keep last revision; next interval retries.
      }
    }

    function closeSource(): void {
      const current = source;
      source = null;
      current?.close();
    }

    function stopInterval(): void {
      if (timerId === undefined) return;
      window.clearInterval(timerId);
      timerId = undefined;
    }

    function startInterval(): void {
      stopInterval();
      if (paused || !isBrowserTabVisible()) return;
      timerId = window.setInterval(() => {
        if (!isBrowserTabVisible()) {
          stopInterval();
          return;
        }
        void checkRevision();
        if (source !== null) return;
        void connectRealtime();
      }, pollMs);
    }

    function applyPollInterval(nextMs: number): void {
      const keepTimer =
        pollMs === nextMs && timerId !== undefined && isBrowserTabVisible();
      pollMs = nextMs;
      if (keepTimer) return;
      startInterval();
    }

    function openSource(credentials: BoardRealtimeCredentials): void {
      closeSource();
      const next = new EventSource(
        buildBoardEventSourceUrl(credentials.sseUrl, credentials.token),
      );
      source = next;
      next.addEventListener(BOARD_INVALIDATE_EVENT, () => {
        void checkRevision();
      });
      next.onopen = () => {
        if (cancelled || source !== next) return;
        applyPollInterval(BOARD_REVISION_SSE_FALLBACK_MS);
      };
      next.onerror = () => {
        if (cancelled || source !== next) return;
        closeSource();
        applyPollInterval(BOARD_REVISION_POLL_MS);
      };
    }

    async function connectRealtime(): Promise<void> {
      if (cancelled || paused || connecting || source) return;
      if (!readPublicSseUrl() || !isBrowserTabVisible()) return;

      connecting = true;
      try {
        const credentials = await fetchBoardRealtimeCredentials();
        if (cancelled || !isBrowserTabVisible() || source) return;
        if (!credentials) {
          applyPollInterval(BOARD_REVISION_POLL_MS);
          return;
        }
        openSource(credentials);
      } catch {
        if (!cancelled) applyPollInterval(BOARD_REVISION_POLL_MS);
      } finally {
        connecting = false;
      }
    }

    function onVisibility(): void {
      if (!isBrowserTabVisible()) {
        closeSource();
        pollMs = BOARD_REVISION_POLL_MS;
        stopInterval();
        return;
      }
      void checkRevision();
      void connectRealtime();
      startInterval();
    }

    if (!paused && isBrowserTabVisible()) {
      void checkRevision();
      startInterval();
      void connectRealtime();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      closeSource();
      if (timerId !== undefined) window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [paused]);
}
