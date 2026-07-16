"use client";

import type { ReactNode } from "react";

import type { KanbanTask } from "@/components/kanban/types";
import {
  useBoardProgressPoll,
  type PollBoardProgressFn,
} from "@/hooks/use-board-progress-poll";

export function BoardLiveProgress({
  tasks,
  pollBoardProgress,
  children,
}: {
  tasks: KanbanTask[];
  pollBoardProgress: PollBoardProgressFn;
  children: (liveTasks: KanbanTask[]) => ReactNode;
}) {
  const liveTasks = useBoardProgressPoll(tasks, pollBoardProgress);
  return <>{children(liveTasks)}</>;
}
