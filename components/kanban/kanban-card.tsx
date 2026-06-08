"use client";

import { useDraggable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";

import { CardBadge } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KanbanTask } from "./types";

export function KanbanCard({ task }: { task: KanbanTask }) {
  const t = useTranslations("tasks.status");
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-md border bg-card p-3 shadow-sm",
        isDragging && "opacity-50",
      )}
      {...listeners}
      {...attributes}
    >
      <p className="font-medium">{task.name}</p>
      <CardBadge className="mt-2">{t(task.status)}</CardBadge>
    </div>
  );
}
