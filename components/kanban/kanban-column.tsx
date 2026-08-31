"use client";

import { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";

import { LoadMoreButton, LoadMoreButtonRow } from "@/components/ui/load-more-button";
import { toKanbanColumnId, toKanbanTaskId } from "@/lib/business/kanban-task-order";
import {
  KANBAN_COLUMN_INITIAL_VISIBLE_COUNT,
  kanbanColumnHasMore,
  nextKanbanColumnVisibleCount,
  sliceVisibleKanbanTasks,
} from "@/lib/kanban/column-visibility";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./kanban-card";
import type { KanbanStep, KanbanTask } from "./types";

const KANBAN_COLUMN_SCROLL_AREA_CLASS = "max-h-[calc(100dvh-9rem)]";

export function KanbanColumn({
  step,
  tasks,
  onTaskClick,
  onTaskPrefetch,
  onTaskVisiblePrefetch,
  onTaskPrefetchCancel,
}: {
  step: KanbanStep;
  tasks: KanbanTask[];
  onTaskClick?: (task: KanbanTask) => void;
  onTaskPrefetch?: (task: KanbanTask) => void;
  onTaskVisiblePrefetch?: (task: KanbanTask) => void;
  onTaskPrefetchCancel?: () => void;
}) {
  const t = useTranslations("kanban");
  const { setNodeRef, isOver } = useDroppable({ id: toKanbanColumnId(step.id) });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(
    KANBAN_COLUMN_INITIAL_VISIBLE_COUNT,
  );

  useEffect(() => {
    setVisibleCount(KANBAN_COLUMN_INITIAL_VISIBLE_COUNT);
  }, [step.id]);

  const effectiveVisibleCount = Math.min(visibleCount, tasks.length);
  const visibleTasks = sliceVisibleKanbanTasks(tasks, effectiveVisibleCount);
  const hasMore = kanbanColumnHasMore(tasks.length, effectiveVisibleCount);
  const sortableIds = visibleTasks.map((task) => toKanbanTaskId(task.id));

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
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </header>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div
          ref={scrollRef}
          className={cn("min-h-0 overflow-y-auto", KANBAN_COLUMN_SCROLL_AREA_CLASS)}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3 pt-2 pr-2">
              {visibleTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onTaskClick={onTaskClick}
                  onTaskPrefetch={onTaskPrefetch}
                  onTaskVisiblePrefetch={onTaskVisiblePrefetch}
                  onTaskPrefetchCancel={onTaskPrefetchCancel}
                  prefetchRootRef={scrollRef}
                />
              ))}
              {hasMore ? (
                <LoadMoreButtonRow>
                  <LoadMoreButton
                    label={t("loadMoreCards")}
                    loadingLabel={t("loading")}
                    onClick={() =>
                      setVisibleCount((current) =>
                        nextKanbanColumnVisibleCount(current, tasks.length),
                      )
                    }
                  />
                </LoadMoreButtonRow>
              ) : null}
            </div>
          </SortableContext>
        </div>
      )}
    </section>
  );
}
