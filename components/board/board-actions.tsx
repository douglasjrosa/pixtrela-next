"use client";

import { useState, useTransition } from "react";

import { KanbanBoard } from "@/components/kanban/kanban-board";
import { KanbanSubtaskAssignModal } from "@/components/kanban/kanban-subtask-assign-modal";
import { KanbanSubtaskCreateModal } from "@/components/kanban/kanban-subtask-create-modal";
import { KanbanTaskSubtasksModal } from "@/components/kanban/kanban-task-subtasks-modal";
import type {
  BoardSubTaskSummary,
  KanbanStep,
  KanbanTask,
} from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

export interface BoardActionsProps {
  steps: KanbanStep[];
  tasks: KanbanTask[];
  teams: TeamAssignmentOption[];
  moveTask: (taskId: number, stepId: number) => void | Promise<void>;
  loadSubtasks: (taskDocumentId: string) => Promise<BoardSubTaskSummary[]>;
  updateSubtaskAssignees: (
    subtaskDocumentId: string,
    taskDocumentId: string,
    assignedToIds: string[],
  ) => Promise<void>;
  createSubtask: (
    taskDocumentId: string,
    values: SubTaskFormInput,
  ) => Promise<void>;
}

export function BoardActions({
  steps,
  tasks,
  teams,
  moveTask,
  loadSubtasks,
  updateSubtaskAssignees,
  createSubtask,
}: BoardActionsProps) {
  const [, startTransition] = useTransition();
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [subtasks, setSubtasks] = useState<BoardSubTaskSummary[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [selectedSubtask, setSelectedSubtask] =
    useState<BoardSubTaskSummary | null>(null);
  const [savingAssignees, setSavingAssignees] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);

  function handleMove(taskId: number, stepId: number): void {
    startTransition(() => {
      void moveTask(taskId, stepId);
    });
  }

  function handleTaskClick(task: KanbanTask): void {
    setSelectedTask(task);
    setSelectedSubtask(null);
    setLoadingSubtasks(true);
    setSubtasks([]);

    void (async () => {
      try {
        const loaded = await loadSubtasks(task.documentId);
        setSubtasks(loaded);
      } finally {
        setLoadingSubtasks(false);
      }
    })();
  }

  function handleCloseSubtasksModal(): void {
    setSelectedTask(null);
    setSelectedSubtask(null);
    setSubtasks([]);
    setLoadingSubtasks(false);
  }

  function handleSelectSubtask(subtask: BoardSubTaskSummary): void {
    setSelectedSubtask(subtask);
  }

  function handleCloseAssignModal(): void {
    setSelectedSubtask(null);
  }

  function handleOpenCreateModal(): void {
    setCreateOpen(true);
  }

  function handleCloseCreateModal(): void {
    setCreateOpen(false);
  }

  async function refreshSubtasksList(taskDocumentId: string): Promise<void> {
    const loaded = await loadSubtasks(taskDocumentId);
    setSubtasks(loaded);
  }

  function handleSaveAssignees(assignedToIds: string[]): void {
    if (!selectedTask || !selectedSubtask) return;

    const taskDocumentId = selectedTask.documentId;
    const subtaskDocumentId = selectedSubtask.documentId;
    setSavingAssignees(true);
    setSelectedSubtask(null);

    void (async () => {
      try {
        await updateSubtaskAssignees(
          subtaskDocumentId,
          taskDocumentId,
          assignedToIds,
        );
        await refreshSubtasksList(taskDocumentId);
      } finally {
        setSavingAssignees(false);
      }
    })();
  }

  function handleCreateSubtask(values: SubTaskFormInput): void {
    if (!selectedTask) return;

    const taskDocumentId = selectedTask.documentId;
    setSavingCreate(true);

    void (async () => {
      try {
        await createSubtask(taskDocumentId, values);
        await refreshSubtasksList(taskDocumentId);
        setCreateOpen(false);
      } finally {
        setSavingCreate(false);
      }
    })();
  }

  const dependencyOptions = subtasks.map((subtask) => ({
    documentId: subtask.documentId,
    name: subtask.name,
  }));

  return (
    <>
      <KanbanBoard
        steps={steps}
        tasks={tasks}
        onMove={handleMove}
        onTaskClick={handleTaskClick}
      />

      <KanbanTaskSubtasksModal
        open={selectedTask !== null}
        taskName={selectedTask?.name ?? ""}
        subtasks={subtasks}
        loading={loadingSubtasks}
        onClose={handleCloseSubtasksModal}
        onSelect={handleSelectSubtask}
        onAddSubtask={handleOpenCreateModal}
      />

      <KanbanSubtaskCreateModal
        open={createOpen}
        taskName={selectedTask?.name ?? ""}
        teams={teams}
        dependencyOptions={dependencyOptions}
        saving={savingCreate}
        onClose={handleCloseCreateModal}
        onCreate={handleCreateSubtask}
      />

      <KanbanSubtaskAssignModal
        open={selectedSubtask !== null}
        subtaskName={selectedSubtask?.name ?? ""}
        teams={teams}
        assignedToIds={selectedSubtask?.assignedTo.map((user) => user.documentId) ?? []}
        saving={savingAssignees}
        onClose={handleCloseAssignModal}
        onSave={handleSaveAssignees}
      />
    </>
  );
}
