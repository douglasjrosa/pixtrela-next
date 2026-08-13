"use client";

import { useState } from "react";
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
  collectKanbanTaskUpdates,
  parseKanbanTaskId,
  resolveKanbanDragEnd,
  tasksInStep,
  type KanbanTaskOrderItem,
} from "@/lib/business/kanban-task-order";
import { isAutoStepTaskOrder } from "@/lib/schemas/step-task-order-by";

import { KanbanCardDragOverlay } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";
import type { KanbanStep, KanbanTask } from "./types";

export interface KanbanBoardProps {
  steps: KanbanStep[];
  tasks: KanbanTask[];
  onApplyOrder?: (
    updates: { documentId: string; index: number; stepId: number | null }[],
  ) => void | Promise<void>;
  onTaskClick?: (task: KanbanTask) => void;
}

const KANBAN_DND_CONTEXT_ID = "kanban-board-dnd";
const KANBAN_DRAG_ACTIVATION_DISTANCE_PX = 8;

export function toKanbanTaskOrderItems(tasks: KanbanTask[]): KanbanTaskOrderItem[] {
  return tasks.map((task) => ({
    id: task.id,
    documentId: task.documentId,
    stepId: task.stepId,
    index: task.index,
  }));
}

export { resolveKanbanDragEnd };

export function KanbanBoard({
  steps,
  tasks,
  onApplyOrder,
  onTaskClick,
}: KanbanBoardProps) {
  const t = useTranslations("kanban");
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

    setActiveTask(tasks.find((task) => task.id === taskId) ?? null);
  }

  function handleDragEnd(event: DragEndEvent): void {
    setActiveTask(null);
    const before = toKanbanTaskOrderItems(tasks);
    const result = resolveKanbanDragEnd(
      before,
      steps,
      event.active.id,
      event.over?.id,
    );
    if (result.type !== "updates") return;

    const activeTaskId = parseKanbanTaskId(event.active.id);
    const overTaskId = parseKanbanTaskId(event.over?.id);
    if (activeTaskId != null && overTaskId != null) {
      const active = tasks.find((task) => task.id === activeTaskId);
      const over = tasks.find((task) => task.id === overTaskId);
      if (
        active &&
        over &&
        active.stepId === over.stepId &&
        active.stepId != null
      ) {
        const step = steps.find((item) => item.id === active.stepId);
        if (step && isAutoStepTaskOrder(step.taskOrderBy)) {
          return;
        }
      }
    }

    const updates = collectKanbanTaskUpdates(before, result.tasks);
    if (updates.length === 0) return;
    void onApplyOrder?.(updates);
  }

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
          "flex h-full min-h-0 flex-1 gap-4 overflow-x-auto p-4 " +
          "max-[500px]:gap-2 max-[500px]:p-2"
        }
      >
        {steps.map((step) => {
          const stepTasks = tasksInStep(toKanbanTaskOrderItems(tasks), step.id);
          const stepCards = stepTasks
            .map((ordered) => tasks.find((task) => task.id === ordered.id))
            .filter((task): task is KanbanTask => task != null);

          return (
            <KanbanColumn
              key={step.id}
              step={step}
              tasks={stepCards}
              onTaskClick={onTaskClick}
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