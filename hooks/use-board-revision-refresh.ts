"use client";

import { useEffect, useRef } from "react";

import { pollBoardRevision } from "@/app/(app)/board/poll-revision";
import {
  hasBoardRevisionChanged,
  type BoardRevision,
} from "@/lib/board/board-revision";

const BOARD_REVISION_POLL_MS = 10_000;

export type SyncBoardStepsFn = () => Promise<void>;

/**
 * Polls board-wide revision. Structural step changes call `onStepsChanged`
 * (syncBoardSteps). Task layout is left to progress poll C — no router.refresh.
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

    async function checkRevision(): Promise<void> {
      if (paused) return;
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }

      try {
        const revision = await pollBoardRevision();
        if (cancelled) return;

        const previous = revisionRef.current;
        if (hasBoardRevisionChanged(previous, revision)) {
          const stepsChanged =
            previous != null &&
            previous.stepsMaxUpdatedAt !== revision.stepsMaxUpdatedAt;
          if (stepsChanged) {
            await onStepsChangedRef.current?.();
          }
        }

        revisionRef.current = revision;
      } catch {
        // Keep last revision; next interval retries.
      }
    }

    function schedule(): void {
      timerId = window.setInterval(() => {
        void checkRevision();
      }, BOARD_REVISION_POLL_MS);
    }

    function onVisibility(): void {
      if (document.visibilityState === "visible") {
        void checkRevision();
      }
    }

    if (!paused) {
      void checkRevision();
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
