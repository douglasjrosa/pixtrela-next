"use client";

import { useTransition } from "react";

import { KanbanBoard } from "@/components/kanban/kanban-board";
import type { KanbanStep, KanbanTask } from "@/components/kanban/types";

export interface BoardActionsProps {
  steps: KanbanStep[];
  tasks: KanbanTask[];
  moveTask: (taskId: number, stepId: number) => void | Promise<void>;
}

export function BoardActions({ steps, tasks, moveTask }: BoardActionsProps) {
  const [, startTransition] = useTransition();

  function handleMove(taskId: number, stepId: number): void {
    startTransition(() => {
      void moveTask(taskId, stepId);
    });
  }

  return (
    <KanbanBoard steps={steps} tasks={tasks} onMove={handleMove} />
  );
}
