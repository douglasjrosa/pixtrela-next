import type { KanbanTask } from "@/components/kanban/types";
import type { BoardColumnState } from "@/lib/board/board-column-state";
import type { BoardColumnPageCursor } from "@/lib/board/column-task-page";

export type BoardColumnPageResult = {
  tasks: KanbanTask[];
  cursor: BoardColumnPageCursor | null;
  totalCount: number;
};

/**
 * Appends a loaded page onto a column. Dedupes by documentId. If the server
 * returns no new tasks and the cursor did not advance, clamps totalCount so
 * infinite-scroll cannot loop forever on a stuck cursor.
 */
export function appendBoardColumnPage(
  column: BoardColumnState,
  result: BoardColumnPageResult,
): BoardColumnState {
  const existingIds = new Set(column.tasks.map((task) => task.documentId));
  const appended = result.tasks.filter(
    (task) => !existingIds.has(task.documentId),
  );
  const cursorUnchanged =
    (column.cursor?.id ?? null) === (result.cursor?.id ?? null);
  const stuckWithoutProgress = appended.length === 0 && cursorUnchanged;

  return {
    ...column,
    tasks: [...column.tasks, ...appended],
    cursor: result.cursor ?? column.cursor,
    totalCount: stuckWithoutProgress
      ? column.tasks.length
      : result.totalCount,
    loadingMore: false,
    loadMoreError: false,
  };
}
