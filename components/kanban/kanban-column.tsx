"use client";

import { useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";

import { toKanbanColumnId, toKanbanTaskId } from "@/lib/business/kanban-task-order";
import { isAutoStepTaskOrder } from "@/lib/schemas/step-task-order-by";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./kanban-card";
import { KanbanCardSkeleton } from "./kanban-card-skeleton";
import type { KanbanStep, KanbanTask } from "./types";

const KANBAN_COLUMN_SCROLL_AREA_CLASS = "max-h-[calc(100dvh-9rem)]";
const KANBAN_COLUMN_WIDTH_CLASS = "w-80 min-w-80";
const KANBAN_LOAD_MORE_SKELETON_COUNT = 5;

export function KanbanColumn({
  step,
  tasks,
  totalCount,
  hasMore,
  loadingMore = false,
  loadMoreError = false,
  onLoadMore,
  onTaskClick,
  onTaskPrefetch,
  onTaskVisiblePrefetch,
  onTaskPrefetchCancel,
}: {
  step: KanbanStep;
  tasks: KanbanTask[];
  totalCount: number;
  hasMore: boolean;
  loadingMore?: boolean;
  loadMoreError?: boolean;
  onLoadMore?: () => void;
  onTaskClick?: (task: KanbanTask) => void;
  onTaskPrefetch?: (task: KanbanTask) => void;
  onTaskVisiblePrefetch?: (task: KanbanTask) => void;
  onTaskPrefetchCancel?: () => void;
}) {
  const t = useTranslations("kanban");
  const sortableDisabled = isAutoStepTaskOrder(step.taskOrderBy);
  const { setNodeRef, isOver } = useDroppable({ id: toKanbanColumnId(step.id) });
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    if (!hasMore || !onLoadMoreRef.current || loadingMore) return;
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;
        onLoadMoreRef.current?.();
      },
      { root, rootMargin: "80px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loadMoreError, tasks.length]);

  const sortableIds = tasks.map((task) => toKanbanTaskId(task.id));

  return (
    <section
      ref={setNodeRef}
      aria-label={step.name}
      className={cn(
        "flex shrink-0 flex-col gap-3 self-start overflow-hidden",
        KANBAN_COLUMN_WIDTH_CLASS,
        "max-h-full rounded-lg border bg-muted p-3",
        isOver && "ring-2 ring-ring",
      )}
    >
      <header className="flex shrink-0 items-center justify-between">
        <h2 className="font-semibold">{step.name}</h2>
        <span className="text-xs text-muted-foreground">{totalCount}</span>
      </header>
      {totalCount === 0 && tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div
          ref={scrollRef}
          className={cn(
            "min-h-0 min-w-0 overflow-x-hidden overflow-y-auto",
            KANBAN_COLUMN_SCROLL_AREA_CLASS,
          )}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
            disabled={sortableDisabled}
          >
            <div className="flex min-w-0 flex-col gap-3 pt-2 pr-2">
              {tasks.map((task) => (
                <KanbanCard
                  key={task.documentId}
                  task={task}
                  sortableDisabled={sortableDisabled}
                  onTaskClick={onTaskClick}
                  onTaskPrefetch={onTaskPrefetch}
                  onTaskVisiblePrefetch={onTaskVisiblePrefetch}
                  onTaskPrefetchCancel={onTaskPrefetchCancel}
                  prefetchRootRef={scrollRef}
                />
              ))}
              {hasMore || loadingMore || loadMoreError ? (
                <div ref={sentinelRef} className="flex flex-col gap-3">
                  {Array.from(
                    { length: KANBAN_LOAD_MORE_SKELETON_COUNT },
                    (_, skeletonIndex) => (
                      <KanbanCardSkeleton
                        key={skeletonIndex}
                        error={loadMoreError && !loadingMore}
                        announce={skeletonIndex === 0}
                      />
                    ),
                  )}
                </div>
              ) : null}
            </div>
          </SortableContext>
        </div>
      )}
    </section>
  );
}
