"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
  applyBoardTaskOrder: (
    updates: { documentId: string; index: number; stepId: number | null }[],
  ) => void | Promise<void>;
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
  applyBoardTaskOrder,
  loadSubtasks,
  updateSubtaskAssignees,
  createSubtask,
}: BoardActionsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [orderedTasks, setOrderedTasks] = useState(tasks);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [subtasks, setSubtasks] = useState<BoardSubTaskSummary[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [selectedSubtask, setSelectedSubtask] =
    useState<BoardSubTaskSummary | null>(null);
  const [savingAssignees, setSavingAssignees] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);

  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  function handleApplyOrder(
    updates: { documentId: string; index: number; stepId: number | null }[],
  ): void {
    const before = orderedTasks;
    const updateMap = new Map(updates.map((update) => [update.documentId, update]));
    const next = before
      .map((task) => {
        const update = updateMap.get(task.documentId);
        if (!update) return task;
        return { ...task, index: update.index, stepId: update.stepId };
      })
      .sort((left, right) => left.index - right.index);

    setOrderedTasks(next);

    startTransition(() => {
      void (async () => {
        try {
          await applyBoardTaskOrder(updates);
          router.refresh();
        } catch {
          setOrderedTasks(before);
        }
      })();
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
        tasks={orderedTasks}
        onApplyOrder={handleApplyOrder}
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
