"use client";

import { useDroppable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";

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
  const { setNodeRef, isOver } = useDroppable({ id: step.id });

  return (
    <section
      ref={setNodeRef}
      aria-label={step.name}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-3 rounded-lg border bg-muted/30 p-3",
        isOver && "ring-2 ring-ring",
      )}
    >
      <header className="flex items-center justify-between">
        <h2 className="font-semibold">{step.name}</h2>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </header>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onTaskClick={onTaskClick} />
        ))
      )}
    </section>
  );
}
