"use client";

import { BoardLiveProgress } from "@/components/board/board-live-progress";
import type { KanbanStep } from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import type { BoardColumnPage } from "@/lib/board/load-board-data";
import type { SubtaskPaymentCurrency } from "@/lib/settings/currency-for-subtasks-types";

import {
  applyBoardTaskRelativeMove,
  createBoardSubtask,
  loadBoardSubtasks,
  loadBoardSubtaskLive,
  loadBoardSubtaskSession,
  loadBoardSubtaskSessions,
  loadFirstBoardColumnPage,
  loadMoreBoardColumnTasks,
  pollBoardProgress,
  releaseBoardSubTaskFlags,
  reorderBoardSubtasks,
  syncBoardSteps,
  updateBoardSubtaskAssignees,
  updateBoardSubtaskLink,
} from "@/app/(app)/board/actions";

export function BoardPageCanvas({
  steps,
  columns,
  teams,
  interactive,
  assignWarnMax,
  assignedCountByColaboratorId,
  paymentCurrency,
  assigneePeople,
}: {
  steps: KanbanStep[];
  columns: BoardColumnPage[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
  paymentCurrency: SubtaskPaymentCurrency;
  assigneePeople: { documentId: string; name: string }[];
}) {
  return (
    <BoardLiveProgress
      columns={columns}
      steps={steps}
      teams={teams}
      interactive={interactive}
      assignWarnMax={assignWarnMax}
      assignedCountByColaboratorId={assignedCountByColaboratorId}
      paymentCurrency={paymentCurrency}
      assigneePeople={assigneePeople}
      pollBoardProgress={pollBoardProgress}
      applyBoardTaskRelativeMove={applyBoardTaskRelativeMove}
      loadMoreBoardColumnTasks={loadMoreBoardColumnTasks}
      syncBoardSteps={syncBoardSteps}
      loadFirstColumnPage={loadFirstBoardColumnPage}
      loadSubtasks={loadBoardSubtasks}
      loadSubtaskLive={loadBoardSubtaskLive}
      loadSubtaskSessions={loadBoardSubtaskSessions}
      loadSubtaskSession={loadBoardSubtaskSession}
      reorderSubtasks={reorderBoardSubtasks}
      updateSubtaskAssignees={updateBoardSubtaskAssignees}
      linkSubtask={updateBoardSubtaskLink}
      createSubtask={createBoardSubtask}
      releaseSubtaskFlags={releaseBoardSubTaskFlags}
    />
  );
}
