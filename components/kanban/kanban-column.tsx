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

  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { root, rootMargin: "0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, loadMoreError, tasks.length]);

  const sortableIds = tasks.map((task) => toKanbanTaskId(task.id));

  return (
    <section
      ref={setNodeRef}
      aria-label={step.name}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-3 self-start overflow-hidden",
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
                <div ref={sentinelRef}>
                  <KanbanCardSkeleton error={loadMoreError && !loadingMore} />
                </div>
              ) : null}
            </div>
          </SortableContext>
        </div>
      )}
    </section>
  );
}
