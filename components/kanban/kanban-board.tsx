"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import {
  parseKanbanTaskId,
  resolveKanbanDragEnd,
  toKanbanTaskId,
} from "@/lib/business/kanban-task-order";
import { resolveBoardTaskRelativeMove } from "@/lib/business/board-task-relative-move";
import {
  boardColumnHasMore,
  boardColumnsFromPages,
  flattenBoardColumnTasks,
  type BoardColumnState,
} from "@/lib/board/board-column-state";
import type { BoardColumnPage } from "@/lib/board/load-board-data";
import type { BoardColumnPageCursor } from "@/lib/board/column-task-page";
import { isAutoStepTaskOrder } from "@/lib/schemas/step-task-order-by";

import { KanbanCardDragOverlay } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";
import type { KanbanStep, KanbanTask } from "./types";

export type LoadMoreBoardColumnResult = {
  tasks: KanbanTask[];
  cursor: BoardColumnPageCursor | null;
  totalCount: number;
};

export interface KanbanBoardProps {
  steps: KanbanStep[];
  columns: BoardColumnPage[];
  onApplyRelativeMove?: (
    move: NonNullable<ReturnType<typeof resolveBoardTaskRelativeMove>>,
  ) => void | Promise<void>;
  onLoadMoreColumn?: (input: {
    stepDocumentId: string;
    cursor: BoardColumnPageCursor | null;
    limit: number;
  }) => Promise<LoadMoreBoardColumnResult>;
  onTaskClick?: (task: KanbanTask) => void;
  onTaskPrefetch?: (task: KanbanTask) => void;
  onTaskVisiblePrefetch?: (task: KanbanTask) => void;
  onTaskPrefetchCancel?: () => void;
  /** Controlled column state from live poll / parent. */
  columnStates?: BoardColumnState[];
  onColumnStatesChange?: (columns: BoardColumnState[]) => void;
}

const KANBAN_DND_CONTEXT_ID = "kanban-board-dnd";
const KANBAN_DRAG_ACTIVATION_DISTANCE_PX = 8;

export function toKanbanTaskOrderItems(tasks: KanbanTask[]) {
  return tasks.map((task) => ({
    id: task.id,
    documentId: task.documentId,
    stepId: task.stepId,
    index: task.index,
  }));
}

export { resolveKanbanDragEnd };

function applyOptimisticRelativeMove(
  columns: BoardColumnState[],
  steps: KanbanStep[],
  move: NonNullable<ReturnType<typeof resolveBoardTaskRelativeMove>>,
): BoardColumnState[] {
  const flat = flattenBoardColumnTasks(columns);
  const active = flat.find((task) => task.documentId === move.taskDocumentId);
  if (!active) return columns;

  const before = toKanbanTaskOrderItems(flat);
  let overRaw: string;
  if (move.placement.kind === "end") {
    overRaw = `column:${move.targetStepKanbanId}`;
  } else {
    const anchor = flat.find(
      (task) => task.documentId === move.placement.anchorDocumentId,
    );
    if (!anchor) return columns;
    overRaw = toKanbanTaskId(anchor.id);
  }

  const result = resolveKanbanDragEnd(
    before,
    steps,
    toKanbanTaskId(active.id),
    overRaw,
  );
  if (result.type !== "updates") return columns;

  const byId = new Map(flat.map((task) => [task.documentId, task]));
  const nextFlat = result.tasks
    .map((ordered) => {
      const task = byId.get(ordered.documentId);
      if (!task) return null;
      return { ...task, index: ordered.index, stepId: ordered.stepId };
    })
    .filter((task): task is KanbanTask => task != null);

  return columns.map((column) => {
    const step = steps.find((item) => item.documentId === column.stepDocumentId);
    if (!step) return column;
    const tasks = nextFlat
      .filter((task) => task.stepId === step.id)
      .sort((left, right) => left.index - right.index);
    let totalCount = column.totalCount;
    const hadActive = column.tasks.some(
      (task) => task.documentId === move.taskDocumentId,
    );
    const hasActive = tasks.some(
      (task) => task.documentId === move.taskDocumentId,
    );
    if (hadActive && !hasActive) totalCount = Math.max(0, totalCount - 1);
    if (!hadActive && hasActive) totalCount += 1;
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
            createdAt: new Date(0).toISOString(),
          }
        : null,
    };
  });
}

export function KanbanBoard({
  steps,
  columns: initialColumns,
  onApplyRelativeMove,
  onLoadMoreColumn,
  onTaskClick,
  onTaskPrefetch,
  onTaskVisiblePrefetch,
  onTaskPrefetchCancel,
  columnStates: controlledColumns,
  onColumnStatesChange,
}: KanbanBoardProps) {
  const t = useTranslations("kanban");
  const [internalColumns, setInternalColumns] = useState(() =>
    boardColumnsFromPages(initialColumns),
  );
  const [prevInitialColumns, setPrevInitialColumns] = useState(initialColumns);
  if (!controlledColumns && initialColumns !== prevInitialColumns) {
    setPrevInitialColumns(initialColumns);
    setInternalColumns(boardColumnsFromPages(initialColumns));
  }
  const columns = controlledColumns ?? internalColumns;

  const setColumns = useCallback(
    (next: BoardColumnState[]): void => {
      if (onColumnStatesChange) {
        onColumnStatesChange(next);
        return;
      }
      setInternalColumns(next);
    },
    [onColumnStatesChange],
  );

  const flatTasks = useMemo(() => flattenBoardColumnTasks(columns), [columns]);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: KANBAN_DRAG_ACTIVATION_DISTANCE_PX },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent): void {
    const taskId = parseKanbanTaskId(event.active.id);
    if (taskId === null) {
      setActiveTask(null);
      return;
    }
    setActiveTask(flatTasks.find((task) => task.id === taskId) ?? null);
  }

  function handleDragEnd(event: DragEndEvent): void {
    setActiveTask(null);
    const move = resolveBoardTaskRelativeMove(
      flatTasks,
      event.active.id,
      event.over?.id,
    );
    if (!move) return;

    const targetStep = steps.find((step) => step.id === move.targetStepKanbanId);
    if (!targetStep) return;

    const active = flatTasks.find(
      (task) => task.documentId === move.taskDocumentId,
    );
    if (
      active &&
      active.stepId === move.targetStepKanbanId &&
      move.placement.kind !== "end" &&
      isAutoStepTaskOrder(targetStep.taskOrderBy)
    ) {
      return;
    }

    const before = columns;
    setColumns(applyOptimisticRelativeMove(columns, steps, move));
    void Promise.resolve(onApplyRelativeMove?.(move)).catch(() => {
      setColumns(before);
    });
  }

  const handleLoadMore = useCallback(
    (step: KanbanStep) => {
      if (!onLoadMoreColumn) return;

      let request:
        | {
            stepDocumentId: string;
            cursor: BoardColumnPageCursor | null;
            limit: number;
          }
        | null = null;

      setColumns(
        columns.map((item) => {
          if (item.stepDocumentId !== step.documentId) return item;
          if (item.loadingMore || !boardColumnHasMore(item)) return item;
          request = {
            stepDocumentId: step.documentId,
            cursor: item.cursor,
            limit: step.tasksPerLoad,
          };
          return { ...item, loadingMore: true, loadMoreError: false };
        }),
      );

      if (!request) return;

      void onLoadMoreColumn(request)
        .then((result) => {
          const update = (current: BoardColumnState[]): BoardColumnState[] =>
            current.map((item) => {
              if (item.stepDocumentId !== step.documentId) return item;
              const existingIds = new Set(
                item.tasks.map((task) => task.documentId),
              );
              const appended = result.tasks.filter(
                (task) => !existingIds.has(task.documentId),
              );
              return {
                ...item,
                tasks: [...item.tasks, ...appended],
                cursor: result.cursor,
                totalCount: result.totalCount,
                loadingMore: false,
                loadMoreError: false,
              };
            });

          if (onColumnStatesChange) {
            onColumnStatesChange(update(columns));
            return;
          }
          setInternalColumns((current) => update(current));
        })
        .catch(() => {
          const update = (current: BoardColumnState[]): BoardColumnState[] =>
            current.map((item) =>
              item.stepDocumentId === step.documentId
                ? { ...item, loadingMore: false, loadMoreError: true }
                : item,
            );
          if (onColumnStatesChange) {
            onColumnStatesChange(update(columns));
            return;
          }
          setInternalColumns((current) => update(current));
        });
    },
    [columns, onColumnStatesChange, onLoadMoreColumn, setColumns],
  );

  if (steps.length === 0) {
    return (
      <p className="text-muted-foreground p-6 text-sm" role="status">
        {t("noSteps")}
      </p>
    );
  }

  return (
    <DndContext
      id={KANBAN_DND_CONTEXT_ID}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div
        className={
          "flex h-full min-h-0 flex-1 items-start gap-4 overflow-x-auto p-4 " +
          "max-[500px]:gap-2 max-[500px]:p-2"
        }
      >
        {steps.map((step) => {
          const column = columns.find(
            (item) => item.stepDocumentId === step.documentId,
          );
          const tasks = column?.tasks ?? [];
          const totalCount = column?.totalCount ?? tasks.length;
          const hasMore = column ? boardColumnHasMore(column) : false;

          return (
            <KanbanColumn
              key={step.documentId}
              step={step}
              tasks={tasks}
              totalCount={totalCount}
              hasMore={hasMore}
              loadingMore={column?.loadingMore}
              loadMoreError={column?.loadMoreError}
              onLoadMore={() => handleLoadMore(step)}
              onTaskClick={onTaskClick}
              onTaskPrefetch={onTaskPrefetch}
              onTaskVisiblePrefetch={onTaskVisiblePrefetch}
              onTaskPrefetchCancel={onTaskPrefetchCancel}
            />
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? <KanbanCardDragOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
