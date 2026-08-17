"use client";

import { useState } from "react";

import { BoardActions, type BoardActionsProps } from "@/components/board/board-actions";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import {
  useBoardProgressPoll,
  type PollBoardProgressFn,
} from "@/hooks/use-board-progress-poll";
import { useBoardRevisionRefresh } from "@/hooks/use-board-revision-refresh";
import type { SubtaskPaymentCurrency } from "@/lib/settings/currency-for-subtasks-types";

/** Data-only keys from the RSC page — must stay JSON-serializable (no render props). */
export const BOARD_LIVE_PROGRESS_DATA_PROP_KEYS = [
  "tasks",
  "steps",
  "teams",
  "interactive",
  "assignWarnMax",
  "assignedCountByColaboratorId",
  "paymentCurrency",
  "assigneePeople",
] as const;

export type BoardLiveProgressDataProps = {
  tasks: KanbanTask[];
  steps: KanbanStep[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
  paymentCurrency: SubtaskPaymentCurrency;
  assigneePeople: { documentId: string; name: string }[];
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
    paymentCurrency: props.paymentCurrency,
    assigneePeople: props.assigneePeople,
  };
}

type BoardLiveProgressProps = BoardLiveProgressDataProps & {
  pollBoardProgress: PollBoardProgressFn;
  applyBoardTaskOrder: BoardActionsProps["applyBoardTaskOrder"];
  loadSubtasks: BoardActionsProps["loadSubtasks"];
  loadSubtaskLive?: BoardActionsProps["loadSubtaskLive"];
  loadSubtaskSessions?: BoardActionsProps["loadSubtaskSessions"];
  loadSubtaskSession?: BoardActionsProps["loadSubtaskSession"];
  reorderSubtasks: BoardActionsProps["reorderSubtasks"];
  updateSubtaskAssignees: BoardActionsProps["updateSubtaskAssignees"];
  linkSubtask: BoardActionsProps["linkSubtask"];
  createSubtask: BoardActionsProps["createSubtask"];
};

export function BoardLiveProgress({
  tasks,
  steps,
  teams,
  interactive,
  assignWarnMax,
  assignedCountByColaboratorId,
  paymentCurrency,
  assigneePeople,
  pollBoardProgress,
  applyBoardTaskOrder,
  loadSubtasks,
  loadSubtaskLive,
  loadSubtaskSessions,
  loadSubtaskSession,
  reorderSubtasks,
  updateSubtaskAssignees,
  linkSubtask,
  createSubtask,
}: BoardLiveProgressProps) {
  const [subtasksModalOpen, setSubtasksModalOpen] = useState(false);
  useBoardRevisionRefresh(subtasksModalOpen);

  const live = useBoardProgressPoll(
    tasks,
    assignedCountByColaboratorId,
    pollBoardProgress,
    subtasksModalOpen,
  );

  if (interactive) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <BoardActions
          steps={steps}
          tasks={live.tasks}
          teams={teams}
          assignWarnMax={assignWarnMax}
          assignedCountByColaboratorId={live.assignedCountByColaboratorId}
          paymentCurrency={paymentCurrency}
          applyBoardTaskOrder={applyBoardTaskOrder}
          loadSubtasks={loadSubtasks}
          loadSubtaskLive={loadSubtaskLive}
          loadSubtaskSessions={loadSubtaskSessions}
          loadSubtaskSession={loadSubtaskSession}
          reorderSubtasks={reorderSubtasks}
          updateSubtaskAssignees={updateSubtaskAssignees}
          linkSubtask={linkSubtask}
          createSubtask={createSubtask}
          assigneePeople={assigneePeople}
          onSubtasksModalOpenChange={setSubtasksModalOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <KanbanBoard steps={steps} tasks={live.tasks} />
    </div>
  );
}
