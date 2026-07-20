"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";

import { toKanbanColumnId, toKanbanTaskId } from "@/lib/business/kanban-task-order";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./kanban-card";
import type { KanbanStep, KanbanTask } from "./types";

export function KanbanColumn({
  step,
  tasks,
  onTaskClick,
}: {
  step: KanbanStep;
  tasks: KanbanTask[];
  onTaskClick?: (task: KanbanTask) => void;
}) {
  const t = useTranslations("kanban");
  const { setNodeRef, isOver } = useDroppable({ id: toKanbanColumnId(step.id) });
  const sortableIds = tasks.map((task) => toKanbanTaskId(task.id));

  return (
    <section
      ref={setNodeRef}
      aria-label={step.name}
      className={cn(
        "flex h-full max-h-full w-72 shrink-0 flex-col gap-3 overflow-hidden",
        "rounded-lg border bg-muted p-3",
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
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3 pt-2 pr-2">
              {tasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onTaskClick={onTaskClick}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      )}
    </section>
  );
}
