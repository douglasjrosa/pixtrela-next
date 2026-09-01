"use client";

import { useEffect, useRef, useState } from "react";

import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import {
  flattenBoardColumnTasks,
  type BoardColumnState,
} from "@/lib/board/board-column-state";
import { mergeBoardColumnsProgressPoll } from "@/lib/board/merge-progress-poll";
import type { BoardProgressPollSnapshot } from "@/lib/board/progress-poll";

const BOARD_PROGRESS_POLL_MS = 12_000;

export type PollBoardProgressFn = (
  tasks: ReadonlyArray<{ documentId: string; status: KanbanTask["status"] }>,
) => Promise<BoardProgressPollSnapshot>;

export type BoardProgressPollState = {
  columns: BoardColumnState[];
  tasks: KanbanTask[];
  assignedCountByColaboratorId: Record<string, number>;
};

/**
 * Polls live board progress for loaded cards only (heavy) while receiving a
 * full layout map. Pauses while the document is hidden or `paused` is true.
 */
export function useBoardProgressPoll(
  columns: BoardColumnState[],
  steps: KanbanStep[],
  assignedCountByColaboratorId: Record<string, number>,
  pollBoardProgress: PollBoardProgressFn,
  paused = false,
): BoardProgressPollState {
  const [polledColumns, setPolledColumns] = useState(columns);
  const [assignedCounts, setAssignedCounts] = useState(
    assignedCountByColaboratorId,
  );
  const [prevColumns, setPrevColumns] = useState(columns);
  if (columns !== prevColumns) {
    setPrevColumns(columns);
    setPolledColumns(columns);
  }
  const [prevAssignedCounts, setPrevAssignedCounts] = useState(
    assignedCountByColaboratorId,
  );
  if (assignedCountByColaboratorId !== prevAssignedCounts) {
    setPrevAssignedCounts(assignedCountByColaboratorId);
    setAssignedCounts(assignedCountByColaboratorId);
  }

  const columnsRef = useRef(columns);
  const stepsRef = useRef(steps);
  const pollRef = useRef(pollBoardProgress);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    pollRef.current = pollBoardProgress;
  }, [pollBoardProgress]);

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
      const boardColumns = columnsRef.current;
      const loadedTasks = flattenBoardColumnTasks(boardColumns);

      inFlight = true;
      try {
        const snapshot = await pollRef.current(
          loadedTasks.map((task) => ({
            documentId: task.documentId,
            status: task.status,
          })),
        );
        if (cancelled) return;
        setPolledColumns((current) =>
          mergeBoardColumnsProgressPoll(current, stepsRef.current, snapshot),
        );
        setAssignedCounts(snapshot.assignedCountByColaboratorId);
      } catch {
        // Keep last good snapshot; next interval retries.
      } finally {
        inFlight = false;
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

  return {
    columns: polledColumns,
    tasks: flattenBoardColumnTasks(polledColumns),
    assignedCountByColaboratorId: assignedCounts,
  };
}
