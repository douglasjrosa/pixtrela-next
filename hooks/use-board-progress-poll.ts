"use client";

import { useEffect, useRef, useState } from "react";

import type { KanbanTask } from "@/components/kanban/types";
import { mergeBoardProgressPoll } from "@/lib/board/merge-progress-poll";
import type { BoardProgressPollSnapshot } from "@/lib/board/progress-poll";

const BOARD_PROGRESS_POLL_MS = 12_000;

export type PollBoardProgressFn = (
  tasks: ReadonlyArray<{ documentId: string; status: KanbanTask["status"] }>,
) => Promise<BoardProgressPollSnapshot>;

export type BoardProgressPollState = {
  tasks: KanbanTask[];
  assignedCountByColaboratorId: Record<string, number>;
};

/**
 * Polls live board progress without refreshing the rest of the page cache.
 * Pauses while the document is hidden.
 * Polls all board tasks so assignment counts stay board-wide.
 */
export function useBoardProgressPoll(
  tasks: KanbanTask[],
  assignedCountByColaboratorId: Record<string, number>,
  pollBoardProgress: PollBoardProgressFn,
): BoardProgressPollState {
  const [polledTasks, setPolledTasks] = useState(tasks);
  const [assignedCounts, setAssignedCounts] = useState(
    assignedCountByColaboratorId,
  );
  const tasksRef = useRef(tasks);
  const pollRef = useRef(pollBoardProgress);

  useEffect(() => {
    tasksRef.current = tasks;
    setPolledTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    setAssignedCounts(assignedCountByColaboratorId);
  }, [assignedCountByColaboratorId]);

  useEffect(() => {
    pollRef.current = pollBoardProgress;
  }, [pollBoardProgress]);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | undefined;

    async function runPoll(): Promise<void> {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      const boardTasks = tasksRef.current;
      if (boardTasks.length === 0) return;

      try {
        const snapshot = await pollRef.current(
          boardTasks.map((task) => ({
            documentId: task.documentId,
            status: task.status,
          })),
        );
        if (cancelled) return;
        setPolledTasks((current) => mergeBoardProgressPoll(current, snapshot));
        setAssignedCounts(snapshot.assignedCountByColaboratorId);
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

  return {
    tasks: polledTasks,
    assignedCountByColaboratorId: assignedCounts,
  };
}
