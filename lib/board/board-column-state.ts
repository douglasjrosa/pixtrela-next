import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import type { BoardColumnPageCursor } from "@/lib/board/column-task-page";
import type { BoardColumnPage } from "@/lib/board/load-board-data";

export type BoardColumnState = {
  stepDocumentId: string;
  totalCount: number;
  tasks: KanbanTask[];
  cursor: BoardColumnPageCursor | null;
  loadingMore: boolean;
  loadMoreError: boolean;
};

export function boardColumnsFromPages(
  columns: ReadonlyArray<BoardColumnPage>,
): BoardColumnState[] {
  return columns.map((column) => ({
    stepDocumentId: column.stepDocumentId,
    totalCount: column.totalCount,
    tasks: column.tasks,
    cursor: column.cursor,
    loadingMore: false,
    loadMoreError: false,
  }));
}

export function flattenBoardColumnTasks(
  columns: ReadonlyArray<BoardColumnState>,
): KanbanTask[] {
  return columns.flatMap((column) => column.tasks);
}

export function boardColumnHasMore(column: BoardColumnState): boolean {
  return column.tasks.length < column.totalCount;
}

export function findBoardColumnForStep(
  columns: ReadonlyArray<BoardColumnState>,
  steps: ReadonlyArray<KanbanStep>,
  stepKanbanId: number,
): BoardColumnState | undefined {
  const step = steps.find((item) => item.id === stepKanbanId);
  if (!step) return undefined;
  return columns.find((column) => column.stepDocumentId === step.documentId);
}
