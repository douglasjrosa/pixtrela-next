"use client";

import { useEffect, useRef, useState } from "react";

import type { KanbanTask } from "@/components/kanban/types";
import { mergeBoardProgressPoll } from "@/lib/board/merge-progress-poll";
import type { BoardProgressPollSnapshot } from "@/lib/board/progress-poll";
import { needsLiveBoardProgress } from "@/lib/business/task-progress";

const BOARD_PROGRESS_POLL_MS = 12_000;

export type PollBoardProgressFn = (
  tasks: ReadonlyArray<{ documentId: string; status: KanbanTask["status"] }>,
) => Promise<BoardProgressPollSnapshot>;

/**
 * Polls live board progress without refreshing the rest of the page cache.
 * Pauses while the document is hidden.
 */
export function useBoardProgressPoll(
  tasks: KanbanTask[],
  pollBoardProgress: PollBoardProgressFn,
): KanbanTask[] {
  const [polledTasks, setPolledTasks] = useState(tasks);
  const tasksRef = useRef(tasks);
  const pollRef = useRef(pollBoardProgress);

  useEffect(() => {
    tasksRef.current = tasks;
    setPolledTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    pollRef.current = pollBoardProgress;
  }, [pollBoardProgress]);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | undefined;

    async function runPoll(): Promise<void> {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      const liveTasks = tasksRef.current.filter(
        (task) =>
          needsLiveBoardProgress(task.status) && task.totalExpectedTime > 0,
      );
      if (liveTasks.length === 0) return;

      try {
        const snapshot = await pollRef.current(
          liveTasks.map((task) => ({
            documentId: task.documentId,
            status: task.status,
          })),
        );
        if (cancelled) return;
        setPolledTasks((current) => mergeBoardProgressPoll(current, snapshot));
      } catch {
        // Keep last good snapshot; next interval retries.
      }
    }

    function schedule(): void {
      timerId = window.setInterval(() => {
        void runPoll();
      }, BOARD_PROGRESS_POLL_MS);
    }

    function onVisibility(): void {
      if (document.visibilityState === "visible") {
        void runPoll();
      }
    }

    void runPoll();
    schedule();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return polledTasks;
}
