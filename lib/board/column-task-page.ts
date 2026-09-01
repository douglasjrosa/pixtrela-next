import { compareTasksForStepOrder } from "@/lib/business/step-task-order";
import type { StepTaskOrderBy } from "@/lib/schemas/step-task-order-by";

export type BoardColumnOrderTask = {
  id: string;
  index: number;
  deliveryDate: string | null;
  createdAt: Date;
};

export type BoardColumnPageCursor = {
  id: string;
  index: number;
  deliveryDate: string | null;
  createdAt: string;
};

export function boardColumnCursorFromTask(
  task: BoardColumnOrderTask,
): BoardColumnPageCursor {
  return {
    id: task.id,
    index: task.index,
    deliveryDate: task.deliveryDate,
    createdAt: task.createdAt.toISOString(),
  };
}

function cursorToOrderItem(cursor: BoardColumnPageCursor): BoardColumnOrderTask {
  return {
    id: cursor.id,
    index: cursor.index,
    deliveryDate: cursor.deliveryDate,
    createdAt: new Date(cursor.createdAt),
  };
}

export function isBoardColumnTaskAfterCursor(
  task: BoardColumnOrderTask,
  cursor: BoardColumnPageCursor,
  orderBy: StepTaskOrderBy,
): boolean {
  const compared = compareTasksForStepOrder(
    { ...task, stepId: null },
    { ...cursorToOrderItem(cursor), stepId: null },
    orderBy,
  );
  if (compared !== 0) return compared > 0;
  return task.id.localeCompare(cursor.id) > 0;
}

/**
 * In-memory keyset page used by unit tests and as the semantic reference for
 * SQL `listActiveTasksForBoardColumn`.
 */
export function selectBoardColumnPage<T extends BoardColumnOrderTask>(
  tasks: ReadonlyArray<T>,
  orderBy: StepTaskOrderBy,
  options: { limit: number; cursor?: BoardColumnPageCursor | null },
): T[] {
  const ordered = [...tasks].sort((left, right) => {
    const byOrder = compareTasksForStepOrder(
      { ...left, stepId: null },
      { ...right, stepId: null },
      orderBy,
    );
    if (byOrder !== 0) return byOrder;
    return left.id.localeCompare(right.id);
  });

  const afterCursor = options.cursor
    ? ordered.filter((task) =>
        isBoardColumnTaskAfterCursor(task, options.cursor!, orderBy),
      )
    : ordered;

  return afterCursor.slice(0, Math.max(0, options.limit));
}
