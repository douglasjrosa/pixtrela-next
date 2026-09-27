import type { BoardSubTaskSummary } from "@/components/kanban/types";

import { splitSubtasksByFinished } from "@/lib/business/board-assign-focus";
import { reorderSubTasksByDrag } from "@/lib/business/subtask-order";

const FINISHED_STATUS = "finished";

export type SubtaskReorderDependencyViolation = {
  consumerName: string;
  producerName: string;
};

type OrderedSubtask = Pick<
  BoardSubTaskSummary,
  "documentId" | "name" | "dependencyIds"
>;

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
  subtasks: readonly Pick<BoardSubTaskSummary, "documentId">[],
): string[] {
  return subtasks.map((item) => item.documentId);
}

export function hasOrderDraftChanges(
  items: readonly Pick<BoardSubTaskSummary, "documentId">[],
  orderBaseline: readonly string[],
): boolean {
  const current = subtaskDocumentIdsInOrder(items);
  if (current.length !== orderBaseline.length) return true;
  return current.some((id, index) => id !== orderBaseline[index]);
}

export function mergeOrderBaseline(
  baseline: readonly string[],
  loaded: readonly Pick<BoardSubTaskSummary, "documentId">[],
): string[] {
  const loadedIds = new Set(loaded.map((item) => item.documentId));
  const kept = baseline.filter((id) => loadedIds.has(id));
  const keptSet = new Set(kept);
  const added = loaded
    .map((item) => item.documentId)
    .filter((id) => !keptSet.has(id));
  return [...kept, ...added];
}

export function applyPreferredSubtaskOrder<
  T extends { documentId: string },
>(items: readonly T[], preferredIds: readonly string[]): T[] {
  const byId = new Map(items.map((item) => [item.documentId, item]));
  const seen = new Set<string>();
  const ordered: T[] = [];
  for (const id of preferredIds) {
    const row = byId.get(id);
    if (!row) continue;
    ordered.push(row);
    seen.add(id);
  }
  for (const row of items) {
    if (seen.has(row.documentId)) continue;
    ordered.push(row);
  }
  return ordered;
}

/**
 * A consumer cannot sit before any of its producers in the same list.
 * Dependencies outside the list are ignored.
 */
export function findSubtaskReorderDependencyViolation(
  ordered: readonly OrderedSubtask[],
  movedDocumentId?: string,
): SubtaskReorderDependencyViolation | null {
  const indexById = new Map(
    ordered.map((item, index) => [item.documentId, index]),
  );
  let fallback: SubtaskReorderDependencyViolation | null = null;

  for (const item of ordered) {
    const itemIndex = indexById.get(item.documentId);
    if (itemIndex === undefined) continue;
    for (const depId of item.dependencyIds ?? []) {
      const depIndex = indexById.get(depId);
      if (depIndex === undefined || itemIndex >= depIndex) continue;
      const producer = ordered.find((row) => row.documentId === depId);
      const violation = {
        consumerName: item.name,
        producerName: producer?.name ?? depId,
      };
      const involvesMoved =
        movedDocumentId !== undefined &&
        (item.documentId === movedDocumentId || depId === movedDocumentId);
      if (involvesMoved) return violation;
      fallback ??= violation;
    }
  }

  return fallback;
}
