"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { pollBoardRevision } from "@/app/(app)/board/poll-revision";
import {
  hasBoardRevisionChanged,
  type BoardRevision,
} from "@/lib/board/board-revision";

const BOARD_REVISION_POLL_MS = 10_000;

/**
 * Polls board-wide revision and refreshes /board when tasks, sub-tasks,
 * activities, assignees, or steps change. Skips while `paused` is true.
 */
export function useBoardRevisionRefresh(paused = false): void {
  const router = useRouter();
  const revisionRef = useRef<BoardRevision | null>(null);

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

        if (hasBoardRevisionChanged(revisionRef.current, revision)) {
          router.refresh();
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
  }, [paused, router]);
}
