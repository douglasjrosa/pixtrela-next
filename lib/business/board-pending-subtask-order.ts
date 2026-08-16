import type { BoardSubTaskSummary } from "@/components/kanban/types";

import { splitSubtasksByFinished } from "@/lib/business/board-assign-focus";
import { reorderSubTasksByDrag } from "@/lib/business/subtask-order";

const FINISHED_STATUS = "finished";

/** Reorders pending sub-tasks while keeping finished rows in place. */
export function reorderPendingSubtasksInPlace(
  subtasks: readonly BoardSubTaskSummary[],
  activeId: string,
  overId: string,
): BoardSubTaskSummary[] | null {
  const { pending } = splitSubtasksByFinished(subtasks);
  const reorderedPending = reorderSubTasksByDrag(
    pending.map((item, index) => ({ ...item, index })),
    activeId,
    overId,
  );
  if (!reorderedPending) return null;

  let pendingIndex = 0;
  return subtasks.map((item) => {
    if (item.status === FINISHED_STATUS) return item;
    const next = reorderedPending[pendingIndex];
    pendingIndex += 1;
    return next ?? item;
  });
}

export function subtaskDocumentIdsInOrder(
  subtasks: readonly BoardSubTaskSummary[],
): string[] {
  return subtasks.map((item) => item.documentId);
}
