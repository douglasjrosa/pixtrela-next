"use server";

import * as board from "@/app/(app)/board/actions";
import type {
  BoardSubTaskSummary,
  KanbanStep,
  KanbanTask,
} from "@/components/kanban/types";
import type { BoardSubtaskLiveState } from "@/lib/board/board-subtask-live";
import type { BoardColumnPageCursor } from "@/lib/board/column-task-page";
import type { BoardProgressPollSnapshot } from "@/lib/board/progress-poll";
import type { BoardSubtaskLinkResult } from "@/lib/business/board-link-queue";
import type { BoardTaskRelativeMove } from "@/lib/business/board-task-relative-move";
import type { ActivitySession, KanbanProgressStatus } from "@/lib/business/task-progress";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

/**
 * Kiosk staff board actions. Each wrapper takes the acting staff user id as the
 * first argument (bound in the page via server-action binding) and delegates to
 * the shared app board actions, which enforce the kiosk staff actor.
 */

export async function pollBoardProgress(
  staffUserId: string,
  tasks: ReadonlyArray<{ documentId: string; status: KanbanProgressStatus }>,
): Promise<BoardProgressPollSnapshot> {
  return board.pollBoardProgress(tasks, staffUserId);
}

export async function applyBoardTaskRelativeMove(
  staffUserId: string,
  move: BoardTaskRelativeMove,
): Promise<void> {
  return board.applyBoardTaskRelativeMove(move, staffUserId);
}

export async function loadMoreBoardColumnTasks(
  staffUserId: string,
  input: {
    stepDocumentId: string;
    cursor: BoardColumnPageCursor | null;
    limit: number;
  },
): Promise<{
  tasks: KanbanTask[];
  cursor: BoardColumnPageCursor | null;
  totalCount: number;
}> {
  return board.loadMoreBoardColumnTasks(input, staffUserId);
}

export async function syncBoardSteps(
  staffUserId: string,
): Promise<{ steps: KanbanStep[] }> {
  return board.syncBoardSteps(staffUserId);
}

export async function loadFirstBoardColumnPage(
  staffUserId: string,
  stepDocumentId: string,
): Promise<{
  stepDocumentId: string;
  totalCount: number;
  tasks: KanbanTask[];
  cursor: BoardColumnPageCursor | null;
}> {
  return board.loadFirstBoardColumnPage(stepDocumentId, staffUserId);
}

export async function loadBoardSubtasks(
  staffUserId: string,
  taskDocumentId: string,
): Promise<BoardSubTaskSummary[]> {
  return board.loadBoardSubtasks(taskDocumentId, staffUserId);
}

export async function loadBoardSubtaskLive(
  staffUserId: string,
  taskDocumentId: string,
): Promise<Record<string, BoardSubtaskLiveState>> {
  return board.loadBoardSubtaskLive(taskDocumentId, staffUserId);
}

export async function loadBoardSubtaskSessions(
  staffUserId: string,
  taskDocumentId: string,
): Promise<Record<string, ActivitySession[]>> {
  return board.loadBoardSubtaskSessions(taskDocumentId, staffUserId);
}

export async function loadBoardSubtaskSession(
  staffUserId: string,
  subTaskDocumentId: string,
): Promise<ActivitySession[]> {
  return board.loadBoardSubtaskSession(subTaskDocumentId, staffUserId);
}

export async function reorderBoardSubtasks(
  staffUserId: string,
  taskDocumentId: string,
  orderedDocumentIds: string[],
  movedDocumentId: string,
): Promise<void> {
  return board.reorderBoardSubtasks(
    taskDocumentId,
    orderedDocumentIds,
    movedDocumentId,
    staffUserId,
  );
}

export async function updateBoardSubtaskAssignees(
  staffUserId: string,
  subtaskDocumentId: string,
  taskDocumentId: string,
  assignedToIds: string[],
  propagateChain = true,
): Promise<void> {
  return board.updateBoardSubtaskAssignees(
    subtaskDocumentId,
    taskDocumentId,
    assignedToIds,
    propagateChain,
    staffUserId,
  );
}

export async function updateBoardSubtaskLink(
  staffUserId: string,
  taskDocumentId: string,
  subtaskDocumentId: string,
  linkedToPrevious: boolean,
): Promise<BoardSubtaskLinkResult> {
  return board.updateBoardSubtaskLink(
    taskDocumentId,
    subtaskDocumentId,
    linkedToPrevious,
    staffUserId,
  );
}

export async function createBoardSubtask(
  staffUserId: string,
  taskDocumentId: string,
  values: SubTaskFormInput,
): Promise<void> {
  return board.createBoardSubtask(taskDocumentId, values, staffUserId);
}

export async function releaseBoardSubTaskFlags(
  staffUserId: string,
  subTaskDocumentId: string,
): Promise<void> {
  return board.releaseBoardSubTaskFlags(subTaskDocumentId, staffUserId);
}
