"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { KanbanColumn } from "./kanban-column";
import type { KanbanStep, KanbanTask } from "./types";

export interface KanbanBoardProps {
  steps: KanbanStep[];
  tasks: KanbanTask[];
  onMove?: (taskId: number, stepId: number) => void;
  onTaskClick?: (task: KanbanTask) => void;
}

const KANBAN_DND_CONTEXT_ID = "kanban-board-dnd";
const KANBAN_DRAG_ACTIVATION_DISTANCE_PX = 8;

/** Pure drag-end resolver for tests and KanbanBoard. */
export function resolveKanbanMove(
  activeId: unknown,
  overId: unknown,
): { taskId: number; stepId: number } | null {
  if (overId == null || activeId == null) return null;
  return { taskId: Number(activeId), stepId: Number(overId) };
}

export function KanbanBoard({
  steps,
  tasks,
  onMove,
  onTaskClick,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: KANBAN_DRAG_ACTIVATION_DISTANCE_PX },
    }),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event: DragEndEvent) {
    const move = resolveKanbanMove(event.active.id, event.over?.id);
    if (move) onMove?.(move.taskId, move.stepId);
  }

  return (
    <DndContext
      id={KANBAN_DND_CONTEXT_ID}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-4">
        {steps.map((step) => (
          <KanbanColumn
            key={step.id}
            step={step}
            tasks={tasks.filter((task) => task.stepId === step.id)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DndContext>
  );
}
