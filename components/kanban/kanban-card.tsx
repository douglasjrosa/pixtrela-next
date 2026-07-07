"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";

import { CardBadge } from "@/components/ui/card";
import {
  kanbanDeliveryDateBadgeClassName,
  resolveKanbanDeliveryDateTone,
} from "@/lib/business/kanban-delivery-badge";
import { formatDatePtBr } from "@/lib/format/datetime";
import { toKanbanTaskId } from "@/lib/business/kanban-task-order";
import { cn } from "@/lib/utils";
import type { KanbanTask } from "./types";

const KANBAN_CLICK_ACTIVATION_DISTANCE_PX = 8;

export interface KanbanCardProps {
  task: KanbanTask;
  onTaskClick?: (task: KanbanTask) => void;
}

export function KanbanCardSurface({
  task,
  className,
}: {
  task: KanbanTask;
  className?: string;
}) {
  const tStatus = useTranslations("tasks.status");
  const deliveryTone = resolveKanbanDeliveryDateTone(
    task.deliveryDate,
    new Date(),
  );

  return (
    <div className={cn("rounded-md border bg-card p-3 shadow-sm", className)}>
      <p className="font-medium">{task.name}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <CardBadge className={kanbanDeliveryDateBadgeClassName(deliveryTone)}>
          {formatDatePtBr(task.deliveryDate)}
        </CardBadge>
        <CardBadge className="shrink-0">{tStatus(task.status)}</CardBadge>
      </div>
    </div>
  );
}

export function KanbanCardDragOverlay({ task }: { task: KanbanTask }) {
  return (
    <KanbanCardSurface
      task={task}
      className="cursor-grabbing shadow-lg ring-2 ring-ring"
    />
  );
}

export function KanbanCard({ task, onTaskClick }: KanbanCardProps) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: toKanbanTaskId(task.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
        onTaskClick && "cursor-pointer",
        isDragging && "opacity-40",
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...attributes}
    >
      <KanbanCardSurface task={task} />
    </div>
  );
}
