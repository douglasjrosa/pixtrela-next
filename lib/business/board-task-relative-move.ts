import {
  parseKanbanColumnId,
  parseKanbanTaskId,
} from "@/lib/business/kanban-task-order";
import type { KanbanTask } from "@/components/kanban/types";

export type BoardTaskRelativePlacement =
  | { kind: "before"; anchorDocumentId: string }
  | { kind: "after"; anchorDocumentId: string }
  | { kind: "end" };

export type BoardTaskRelativeMove = {
  taskDocumentId: string;
  targetStepKanbanId: number;
  placement: BoardTaskRelativePlacement;
};

/**
 * Resolves a DnD over-target into a relative placement.
 * Drop on a card → before that card; drop on a column → end.
 */
export function resolveBoardTaskRelativeMove(
  tasks: ReadonlyArray<Pick<KanbanTask, "id" | "documentId" | "stepId">>,
  activeRaw: unknown,
  overRaw: unknown,
): BoardTaskRelativeMove | null {
  const activeTaskId = parseKanbanTaskId(activeRaw);
  if (activeTaskId == null) return null;
  const active = tasks.find((task) => task.id === activeTaskId);
  if (!active) return null;

  const overTaskId = parseKanbanTaskId(overRaw);
  if (overTaskId != null) {
    const over = tasks.find((task) => task.id === overTaskId);
    if (!over || over.stepId == null) return null;
    if (over.documentId === active.documentId) return null;
    return {
      taskDocumentId: active.documentId,
      targetStepKanbanId: over.stepId,
      placement: { kind: "before", anchorDocumentId: over.documentId },
    };
  }

  const overStepId = parseKanbanColumnId(overRaw);
  if (overStepId != null) {
    return {
      taskDocumentId: active.documentId,
      targetStepKanbanId: overStepId,
      placement: { kind: "end" },
    };
  }

  return null;
}
