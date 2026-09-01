import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import type { BoardColumnState } from "@/lib/board/board-column-state";
import type { BoardProgressPollSnapshot } from "@/lib/board/progress-poll";
import { isBoardColumnTaskAfterCursor } from "@/lib/board/column-task-page";
import { compareTasksForStepOrder } from "@/lib/business/step-task-order";
import {
  needsLiveBoardProgress,
  shouldShowKanbanTaskProgress,
} from "@/lib/business/task-progress";
import { stableKanbanTaskNumericId } from "@/lib/board/kanban-drizzle-ids";

function applyLoadedTaskFields(
  task: KanbanTask,
  snapshot: BoardProgressPollSnapshot,
): KanbanTask {
  const layout = snapshot.layoutByTaskId[task.documentId];
  const withLayout: KanbanTask = layout
    ? {
        ...task,
        status: layout.status,
        stepId: layout.stepId,
        index: layout.index,
        name: layout.name,
        qty: layout.qty,
        deliveryDate: layout.deliveryDate,
        endedAt: layout.endedAt,
      }
    : task;

  const badges = snapshot.badgesByTaskId[task.documentId];
  const withBadges: KanbanTask = badges
    ? {
        ...withLayout,
        activeColaboratorCount: badges.activeColaboratorCount,
        unassignedSubTaskCount: badges.unassignedSubTaskCount,
        participantCount: badges.participantCount,
      }
    : withLayout;

  if (
    !shouldShowKanbanTaskProgress(withBadges.status) ||
    withBadges.totalExpectedTime <= 0
  ) {
    return withBadges;
  }

  const progress = snapshot.progressByTaskId[task.documentId];
  const totals = snapshot.totalsByTaskId[task.documentId];
  return {
    ...withBadges,
    progressPending: false,
    progressInput: progress ??
      withBadges.progressInput ?? {
        subTasks: [],
        openActivityStartedAts: [],
      },
    totalTimeSpent: totals?.totalTimeSpent ?? withBadges.totalTimeSpent,
    totalExpectedTime: totals?.totalExpectedTime ?? withBadges.totalExpectedTime,
    progressNowMs: needsLiveBoardProgress(withBadges.status)
      ? snapshot.nowMs
      : (withBadges.progressNowMs ?? snapshot.nowMs),
  };
}

function sortColumnTasks(
  tasks: KanbanTask[],
  orderBy: KanbanStep["taskOrderBy"],
): KanbanTask[] {
  return [...tasks].sort((left, right) => {
    const compared = compareTasksForStepOrder(
      {
        id: left.documentId,
        stepId: null,
        index: left.index,
        deliveryDate: left.deliveryDate ?? null,
        createdAt: new Date(0),
      },
      {
        id: right.documentId,
        stepId: null,
        index: right.index,
        deliveryDate: right.deliveryDate ?? null,
        createdAt: new Date(0),
      },
      orderBy,
    );
    if (compared !== 0) return compared;
    return left.documentId.localeCompare(right.documentId);
  });
}

function taskFromLayout(
  documentId: string,
  layout: BoardProgressPollSnapshot["layoutByTaskId"][string],
): KanbanTask {
  return {
    id: stableKanbanTaskNumericId(documentId),
    documentId,
    name: layout.name,
    qty: layout.qty,
    status: layout.status,
    stepId: layout.stepId,
    index: layout.index,
    deliveryDate: layout.deliveryDate,
    endedAt: layout.endedAt,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
  };
}

/**
 * Merges poll C into paged board columns: updates loaded cards, moves between
 * columns when the card is in the loaded window, and adjusts totalCount.
 */
export function mergeBoardColumnsProgressPoll(
  columns: readonly BoardColumnState[],
  steps: readonly KanbanStep[],
  snapshot: BoardProgressPollSnapshot,
): BoardColumnState[] {
  const stepByKanbanId = new Map(steps.map((step) => [step.id, step]));
  const stepByDocumentId = new Map(
    steps.map((step) => [step.documentId, step]),
  );

  const loadedById = new Map<string, KanbanTask>();
  for (const column of columns) {
    for (const task of column.tasks) {
      loadedById.set(task.documentId, applyLoadedTaskFields(task, snapshot));
    }
  }

  const nextByStepDoc = new Map<string, KanbanTask[]>();
  for (const column of columns) {
    nextByStepDoc.set(column.stepDocumentId, []);
  }

  const layoutIds = new Set(Object.keys(snapshot.layoutByTaskId));

  for (const [documentId, task] of loadedById) {
    if (!layoutIds.has(documentId)) continue;
    const layout = snapshot.layoutByTaskId[documentId]!;
    const step =
      layout.stepId != null ? stepByKanbanId.get(layout.stepId) : undefined;
    if (!step) continue;
    const bucket = nextByStepDoc.get(step.documentId);
    if (!bucket) continue;
    bucket.push({ ...task, ...layout, documentId });
  }

  for (const [documentId, layout] of Object.entries(snapshot.layoutByTaskId)) {
    if (loadedById.has(documentId)) continue;
    const step =
      layout.stepId != null ? stepByKanbanId.get(layout.stepId) : undefined;
    if (!step) continue;
    const column = columns.find(
      (item) => item.stepDocumentId === step.documentId,
    );
    if (!column) continue;
    const last = column.tasks[column.tasks.length - 1];
    if (!last) {
      if (column.tasks.length === 0 && column.totalCount === 0) {
        const bucket = nextByStepDoc.get(step.documentId);
        bucket?.push(taskFromLayout(documentId, layout));
      }
      continue;
    }
    // Only insert into the loaded window when the layout task sorts at or
    // before the last loaded card (not after the keyset cursor).
    const afterWindow = isBoardColumnTaskAfterCursor(
      {
        id: documentId,
        index: layout.index,
        deliveryDate: layout.deliveryDate ?? null,
        createdAt: new Date(0),
      },
      {
        id: last.documentId,
        index: last.index,
        deliveryDate: last.deliveryDate ?? null,
        createdAt: column.cursor?.createdAt ?? new Date(0).toISOString(),
      },
      step.taskOrderBy,
    );
    if (afterWindow) continue;
    const bucket = nextByStepDoc.get(step.documentId);
    bucket?.push(taskFromLayout(documentId, layout));
  }

  return columns.map((column) => {
    const step = stepByDocumentId.get(column.stepDocumentId);
    const tasks = sortColumnTasks(
      nextByStepDoc.get(column.stepDocumentId) ?? [],
      step?.taskOrderBy ?? "manual",
    );
    const totalFromSnapshot = snapshot.totalCountByStepId?.[column.stepDocumentId];
    const totalCount =
      totalFromSnapshot ??
      Math.max(
        tasks.length,
        column.totalCount -
          column.tasks.filter((task) => !layoutIds.has(task.documentId)).length +
          Math.max(0, tasks.length - column.tasks.length),
      );
    const last = tasks[tasks.length - 1];
    return {
      ...column,
      tasks,
      totalCount,
      cursor: last
        ? {
            id: last.documentId,
            index: last.index,
            deliveryDate: last.deliveryDate ?? null,
            createdAt: column.cursor?.createdAt ?? new Date(0).toISOString(),
          }
        : null,
    };
  });
}

/**
 * Flat merge kept for tests and callers that still use a task array.
 */
export function mergeBoardProgressPoll(
  tasks: readonly KanbanTask[],
  snapshot: BoardProgressPollSnapshot,
): KanbanTask[] {
  return tasks
    .filter((task) => snapshot.layoutByTaskId[task.documentId] != null ||
      Object.keys(snapshot.layoutByTaskId).length === 0)
    .map((task) => applyLoadedTaskFields(task, snapshot));
}
