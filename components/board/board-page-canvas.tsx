"use client";

import { BoardLiveProgress } from "@/components/board/board-live-progress";
import type { BoardActionsProps } from "@/components/board/board-actions";
import type { KanbanStep } from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import type { BoardColumnPage } from "@/lib/board/load-board-data";
import type { PollBoardProgressFn } from "@/hooks/use-board-progress-poll";
import type { BoardTaskRelativeMove } from "@/lib/business/board-task-relative-move";
import type { LoadMoreBoardColumnResult } from "@/components/kanban/kanban-board";
import type { SubtaskPaymentCurrency } from "@/lib/settings/currency-for-subtasks-types";

import {
  applyBoardTaskRelativeMove as appApplyBoardTaskRelativeMove,
  createBoardSubtask as appCreateBoardSubtask,
  loadBoardSubtasks as appLoadBoardSubtasks,
  loadBoardSubtaskLive as appLoadBoardSubtaskLive,
  loadBoardSubtaskSession as appLoadBoardSubtaskSession,
  loadBoardSubtaskSessions as appLoadBoardSubtaskSessions,
  loadFirstBoardColumnPage as appLoadFirstBoardColumnPage,
  loadMoreBoardColumnTasks as appLoadMoreBoardColumnTasks,
  pollBoardProgress as appPollBoardProgress,
  releaseBoardSubTaskFlags as appReleaseBoardSubTaskFlags,
  reorderBoardSubtasks as appReorderBoardSubtasks,
  syncBoardSteps as appSyncBoardSteps,
  updateBoardSubtaskAssignees as appUpdateBoardSubtaskAssignees,
  updateBoardSubtaskLink as appUpdateBoardSubtaskLink,
} from "@/app/(app)/board/actions";

/** Board server actions the canvas needs. Overridable for the kiosk board. */
export interface BoardCanvasActions {
  pollBoardProgress: PollBoardProgressFn;
  applyBoardTaskRelativeMove: (
    move: BoardTaskRelativeMove,
  ) => void | Promise<void>;
  loadMoreBoardColumnTasks: (input: {
    stepDocumentId: string;
    cursor: BoardColumnPage["cursor"];
    limit: number;
  }) => Promise<LoadMoreBoardColumnResult>;
  syncBoardSteps: () => Promise<{ steps: KanbanStep[] }>;
  loadFirstBoardColumnPage: (stepDocumentId: string) => Promise<BoardColumnPage>;
  loadBoardSubtasks: BoardActionsProps["loadSubtasks"];
  loadBoardSubtaskLive: BoardActionsProps["loadSubtaskLive"];
  loadBoardSubtaskSessions: BoardActionsProps["loadSubtaskSessions"];
  loadBoardSubtaskSession: BoardActionsProps["loadSubtaskSession"];
  reorderBoardSubtasks: BoardActionsProps["reorderSubtasks"];
  updateBoardSubtaskAssignees: BoardActionsProps["updateSubtaskAssignees"];
  updateBoardSubtaskLink: BoardActionsProps["linkSubtask"];
  createBoardSubtask: BoardActionsProps["createSubtask"];
  releaseBoardSubTaskFlags: BoardActionsProps["releaseSubtaskFlags"];
}

const DEFAULT_BOARD_ACTIONS: BoardCanvasActions = {
  pollBoardProgress: appPollBoardProgress,
  applyBoardTaskRelativeMove: appApplyBoardTaskRelativeMove,
  loadMoreBoardColumnTasks: appLoadMoreBoardColumnTasks,
  syncBoardSteps: appSyncBoardSteps,
  loadFirstBoardColumnPage: appLoadFirstBoardColumnPage,
  loadBoardSubtasks: appLoadBoardSubtasks,
  loadBoardSubtaskLive: appLoadBoardSubtaskLive,
  loadBoardSubtaskSessions: appLoadBoardSubtaskSessions,
  loadBoardSubtaskSession: appLoadBoardSubtaskSession,
  reorderBoardSubtasks: appReorderBoardSubtasks,
  updateBoardSubtaskAssignees: appUpdateBoardSubtaskAssignees,
  updateBoardSubtaskLink: appUpdateBoardSubtaskLink,
  createBoardSubtask: appCreateBoardSubtask,
  releaseBoardSubTaskFlags: appReleaseBoardSubTaskFlags,
};

export function BoardPageCanvas({
  steps,
  columns,
  teams,
  interactive,
  assignWarnMax,
  assignedCountByColaboratorId,
  paymentCurrency,
  assigneePeople,
  actions = DEFAULT_BOARD_ACTIONS,
}: {
  steps: KanbanStep[];
  columns: BoardColumnPage[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
  paymentCurrency: SubtaskPaymentCurrency;
  assigneePeople: { documentId: string; name: string }[];
  actions?: BoardCanvasActions;
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
      pollBoardProgress={actions.pollBoardProgress}
      applyBoardTaskRelativeMove={actions.applyBoardTaskRelativeMove}
      loadMoreBoardColumnTasks={actions.loadMoreBoardColumnTasks}
      syncBoardSteps={actions.syncBoardSteps}
      loadFirstColumnPage={actions.loadFirstBoardColumnPage}
      loadSubtasks={actions.loadBoardSubtasks}
      loadSubtaskLive={actions.loadBoardSubtaskLive}
      loadSubtaskSessions={actions.loadBoardSubtaskSessions}
      loadSubtaskSession={actions.loadBoardSubtaskSession}
      reorderSubtasks={actions.reorderBoardSubtasks}
      updateSubtaskAssignees={actions.updateBoardSubtaskAssignees}
      linkSubtask={actions.updateBoardSubtaskLink}
      createSubtask={actions.createBoardSubtask}
      releaseSubtaskFlags={actions.releaseBoardSubTaskFlags}
    />
  );
}
