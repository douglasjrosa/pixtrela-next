"use client";

import { useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";

import { CardBadge } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KanbanTask } from "./types";

const KANBAN_CLICK_ACTIVATION_DISTANCE_PX = 8;

export interface KanbanCardProps {
  task: KanbanTask;
  onTaskClick?: (task: KanbanTask) => void;
}

export function KanbanCard({ task, onTaskClick }: KanbanCardProps) {
  const t = useTranslations("tasks.status");
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    listeners?.onPointerDown?.(event);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>): void {
    listeners?.onPointerUp?.(event);

    if (!pointerStart.current || !onTaskClick) {
      pointerStart.current = null;
      return;
    }

    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    pointerStart.current = null;

    if (Math.hypot(dx, dy) < KANBAN_CLICK_ACTIVATION_DISTANCE_PX) {
      onTaskClick(task);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-md border bg-card p-3 shadow-sm",
        onTaskClick && "cursor-pointer",
        isDragging && "opacity-50",
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...attributes}
    >
      <p className="font-medium">{task.name}</p>
      <CardBadge className="mt-2">{t(task.status)}</CardBadge>
    </div>
  );
}
