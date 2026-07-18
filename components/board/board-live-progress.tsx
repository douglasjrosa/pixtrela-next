"use client";

import { BoardActions, type BoardActionsProps } from "@/components/board/board-actions";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import {
  useBoardProgressPoll,
  type PollBoardProgressFn,
} from "@/hooks/use-board-progress-poll";

/** Data-only keys from the RSC page — must stay JSON-serializable (no render props). */
export const BOARD_LIVE_PROGRESS_DATA_PROP_KEYS = [
  "tasks",
  "steps",
  "teams",
  "interactive",
  "assignWarnMax",
  "assignedCountByColaboratorId",
] as const;

export type BoardLiveProgressDataProps = {
  tasks: KanbanTask[];
  steps: KanbanStep[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
};

export function pickBoardLiveProgressDataProps(
  props: BoardLiveProgressDataProps,
): BoardLiveProgressDataProps {
  return {
    tasks: props.tasks,
    steps: props.steps,
    teams: props.teams,
    interactive: props.interactive,
    assignWarnMax: props.assignWarnMax,
    assignedCountByColaboratorId: props.assignedCountByColaboratorId,
  };
}

type BoardLiveProgressProps = BoardLiveProgressDataProps & {
  pollBoardProgress: PollBoardProgressFn;
  applyBoardTaskOrder: BoardActionsProps["applyBoardTaskOrder"];
  loadSubtasks: BoardActionsProps["loadSubtasks"];
  updateSubtaskAssignees: BoardActionsProps["updateSubtaskAssignees"];
  createSubtask: BoardActionsProps["createSubtask"];
};

export function BoardLiveProgress({
  tasks,
  steps,
  teams,
  interactive,
  assignWarnMax,
  assignedCountByColaboratorId,
  pollBoardProgress,
  applyBoardTaskOrder,
  loadSubtasks,
  updateSubtaskAssignees,
  createSubtask,
}: BoardLiveProgressProps) {
  const live = useBoardProgressPoll(
    tasks,
    assignedCountByColaboratorId,
    pollBoardProgress,
  );

  if (interactive) {
    return (
      <BoardActions
        steps={steps}
        tasks={live.tasks}
        teams={teams}
        assignWarnMax={assignWarnMax}
        assignedCountByColaboratorId={live.assignedCountByColaboratorId}
        applyBoardTaskOrder={applyBoardTaskOrder}
        loadSubtasks={loadSubtasks}
        updateSubtaskAssignees={updateSubtaskAssignees}
        createSubtask={createSubtask}
      />
    );
  }

  return <KanbanBoard steps={steps} tasks={live.tasks} />;
}
