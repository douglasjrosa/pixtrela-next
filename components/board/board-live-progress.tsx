"use client";

import { useCallback, useState } from "react";

import { BoardActions, type BoardActionsProps } from "@/components/board/board-actions";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import type { KanbanStep } from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import {
  boardColumnsFromPages,
  type BoardColumnState,
} from "@/lib/board/board-column-state";
import type { BoardColumnPage } from "@/lib/board/load-board-data";
import type { LoadMoreBoardColumnResult } from "@/components/kanban/kanban-board";
import {
  useBoardProgressPoll,
  type PollBoardProgressFn,
} from "@/hooks/use-board-progress-poll";
import { useBoardRevisionRefresh } from "@/hooks/use-board-revision-refresh";
import type { BoardTaskRelativeMove } from "@/lib/business/board-task-relative-move";
import type { SubtaskPaymentCurrency } from "@/lib/settings/currency-for-subtasks-types";

/** Data-only keys from the RSC page — must stay JSON-serializable (no render props). */
export const BOARD_LIVE_PROGRESS_DATA_PROP_KEYS = [
  "columns",
  "steps",
  "teams",
  "interactive",
  "assignWarnMax",
  "assignedCountByColaboratorId",
  "paymentCurrency",
  "assigneePeople",
] as const;

export type BoardLiveProgressDataProps = {
  columns: BoardColumnPage[];
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
    columns: props.columns,
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
  applyBoardTaskRelativeMove: (
    move: BoardTaskRelativeMove,
  ) => void | Promise<void>;
  loadMoreBoardColumnTasks: (input: {
    stepDocumentId: string;
    cursor: BoardColumnPage["cursor"];
    limit: number;
  }) => Promise<LoadMoreBoardColumnResult>;
  syncBoardSteps: () => Promise<{ steps: KanbanStep[] }>;
  loadFirstColumnPage?: (stepDocumentId: string) => Promise<BoardColumnPage>;
  loadSubtasks: BoardActionsProps["loadSubtasks"];
  loadSubtaskLive?: BoardActionsProps["loadSubtaskLive"];
  loadSubtaskSessions?: BoardActionsProps["loadSubtaskSessions"];
  loadSubtaskSession?: BoardActionsProps["loadSubtaskSession"];
  reorderSubtasks: BoardActionsProps["reorderSubtasks"];
  updateSubtaskAssignees: BoardActionsProps["updateSubtaskAssignees"];
  linkSubtask: BoardActionsProps["linkSubtask"];
  createSubtask: BoardActionsProps["createSubtask"];
  releaseSubtaskFlags?: BoardActionsProps["releaseSubtaskFlags"];
};

export function BoardLiveProgress({
  columns: initialColumns,
  steps: initialSteps,
  teams,
  interactive,
  assignWarnMax,
  assignedCountByColaboratorId,
  paymentCurrency,
  assigneePeople,
  pollBoardProgress,
  applyBoardTaskRelativeMove,
  loadMoreBoardColumnTasks,
  syncBoardSteps,
  loadFirstColumnPage,
  loadSubtasks,
  loadSubtaskLive,
  loadSubtaskSessions,
  loadSubtaskSession,
  reorderSubtasks,
  updateSubtaskAssignees,
  linkSubtask,
  createSubtask,
  releaseSubtaskFlags,
}: BoardLiveProgressProps) {
  const [subtasksModalOpen, setSubtasksModalOpen] = useState(false);
  const [steps, setSteps] = useState(initialSteps);
  const [columns, setColumns] = useState<BoardColumnState[]>(() =>
    boardColumnsFromPages(initialColumns),
  );
  const [prevInitialSteps, setPrevInitialSteps] = useState(initialSteps);
  const [prevInitialColumns, setPrevInitialColumns] = useState(initialColumns);
  if (initialSteps !== prevInitialSteps) {
    setPrevInitialSteps(initialSteps);
    setSteps(initialSteps);
  }
  if (initialColumns !== prevInitialColumns) {
    setPrevInitialColumns(initialColumns);
    setColumns(boardColumnsFromPages(initialColumns));
  }

  const handleStepsChanged = useCallback(async () => {
    const synced = await syncBoardSteps();
    const previousById = new Map(
      steps.map((step) => [step.documentId, step] as const),
    );
    setSteps(synced.steps);

    const nextColumns: BoardColumnState[] = [];
    for (const step of synced.steps) {
      const existing = columns.find(
        (column) => column.stepDocumentId === step.documentId,
      );
      const previous = previousById.get(step.documentId);
      const orderChanged =
        previous != null && previous.taskOrderBy !== step.taskOrderBy;

      if (existing && !orderChanged) {
        nextColumns.push(existing);
        continue;
      }

      if (loadFirstColumnPage) {
        const page = await loadFirstColumnPage(step.documentId);
        nextColumns.push({
          stepDocumentId: page.stepDocumentId,
          totalCount: page.totalCount,
          tasks: page.tasks,
          cursor: page.cursor,
          loadingMore: false,
          loadMoreError: false,
        });
        continue;
      }

      nextColumns.push({
        stepDocumentId: step.documentId,
        totalCount: existing?.totalCount ?? 0,
        tasks: orderChanged ? [] : (existing?.tasks ?? []),
        cursor: orderChanged ? null : (existing?.cursor ?? null),
        loadingMore: false,
        loadMoreError: false,
      });
    }
    setColumns(nextColumns);
  }, [columns, loadFirstColumnPage, steps, syncBoardSteps]);

  useBoardRevisionRefresh(subtasksModalOpen, handleStepsChanged);

  const live = useBoardProgressPoll(
    columns,
    steps,
    assignedCountByColaboratorId,
    pollBoardProgress,
    subtasksModalOpen,
  );

  if (interactive) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <BoardActions
          steps={steps}
          columns={live.columns}
          teams={teams}
          assignWarnMax={assignWarnMax}
          assignedCountByColaboratorId={live.assignedCountByColaboratorId}
          paymentCurrency={paymentCurrency}
          applyBoardTaskRelativeMove={applyBoardTaskRelativeMove}
          loadMoreBoardColumnTasks={loadMoreBoardColumnTasks}
          onColumnsChange={setColumns}
          loadSubtasks={loadSubtasks}
          loadSubtaskLive={loadSubtaskLive}
          loadSubtaskSessions={loadSubtaskSessions}
          loadSubtaskSession={loadSubtaskSession}
          reorderSubtasks={reorderSubtasks}
          updateSubtaskAssignees={updateSubtaskAssignees}
          linkSubtask={linkSubtask}
          createSubtask={createSubtask}
          releaseSubtaskFlags={releaseSubtaskFlags}
          assigneePeople={assigneePeople}
          onSubtasksModalOpenChange={setSubtasksModalOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <KanbanBoard
        steps={steps}
        columns={initialColumns}
        columnStates={live.columns}
        onColumnStatesChange={setColumns}
        onLoadMoreColumn={loadMoreBoardColumnTasks}
      />
    </div>
  );
}
