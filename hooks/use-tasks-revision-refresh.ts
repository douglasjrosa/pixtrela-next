"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { pollTasksRevision } from "@/app/(app)/tasks/poll-revision";
import { isBrowserTabVisible } from "@/lib/browser/is-browser-tab-visible";
import {
  hasTasksRevisionChanged,
  type TasksRevision,
} from "@/lib/tasks/tasks-revision";

const TASKS_REVISION_POLL_MS = 10_000;

/**
 * Polls active-task revision and refreshes the current route when CRM webhooks
 * (or other writers) change the tasks table.
 */
export function useTasksRevisionRefresh(): void {
  const router = useRouter();
  const revisionRef = useRef<TasksRevision | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | undefined;

    function stopInterval(): void {
      if (timerId === undefined) return;
      window.clearInterval(timerId);
      timerId = undefined;
    }

    async function checkRevision(): Promise<void> {
      if (!isBrowserTabVisible()) return;

      try {
        const revision = await pollTasksRevision();
        if (cancelled) return;

        if (hasTasksRevisionChanged(revisionRef.current, revision)) {
          router.refresh();
        }

        revisionRef.current = revision;
      } catch {
        // Keep last revision; next interval retries.
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
        void checkRevision();
      }, TASKS_REVISION_POLL_MS);
    }

    function onVisibility(): void {
      if (!isBrowserTabVisible()) {
        stopInterval();
        return;
      }
      void checkRevision();
      if (timerId === undefined) schedule();
    }

    if (isBrowserTabVisible()) {
      void checkRevision();
      schedule();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);
}
