"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { KanbanBoard } from "@/components/kanban/kanban-board";
import { KanbanSubtaskCreateModal } from "@/components/kanban/kanban-subtask-create-modal";
import { KanbanTaskSubtasksModal } from "@/components/kanban/kanban-task-subtasks-modal";
import type {
  BoardSubTaskSummary,
  KanbanStep,
  KanbanTask,
} from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import {
  applyAssigneeDraftDeltasToCounts,
  buildAssigneesSnapshot,
  collectDirtyAssigneeUpdates,
  hasAssigneeDraftChanges,
  mergeAssigneesBaseline,
  mergeLoadedSubtasksWithDraft,
  resolveAssigneeNames,
} from "@/lib/business/board-assignee-draft";
import { countUnassignedSubTasks } from "@/lib/business/kanban-card-badges";
import { formatTaskDisplayTitle } from "@/lib/business/task-display-title";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { SubtaskPaymentCurrency } from "@/lib/strapi/currency-for-subtasks";

const FINISHED_STATUS = "finished";

function resolveUnassignedSubTaskCount(
  items: readonly BoardSubTaskSummary[],
): number {
  return countUnassignedSubTasks(
    items
      .filter((item) => item.status !== FINISHED_STATUS)
      .map((item) => ({ assignedCount: item.assignedTo.length })),
  );
}

export interface BoardActionsProps {
  steps: KanbanStep[];
  tasks: KanbanTask[];
  teams: TeamAssignmentOption[];
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
  paymentCurrency: SubtaskPaymentCurrency;
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
    options?: { addToTemplate?: boolean },
  ) => Promise<void>;
}

export function BoardActions({
  steps,
  tasks,
  teams,
  assignWarnMax,
  assignedCountByColaboratorId,
  paymentCurrency,
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
  const [assigneesBaseline, setAssigneesBaseline] = useState<
    Record<string, string>
  >({});
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [savingAssignees, setSavingAssignees] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);

  const assignedCountsForUi = useMemo(
    () =>
      applyAssigneeDraftDeltasToCounts(
        assignedCountByColaboratorId,
        subtasks,
        assigneesBaseline,
      ),
    [assignedCountByColaboratorId, subtasks, assigneesBaseline],
  );

  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  function handleApplyOrder(
    updates: { documentId: string; index: number; stepId: number | null }[],
  ): void {
    const before = orderedTasks;
    const updateMap = new Map(
      updates.map((update) => [update.documentId, update]),
    );
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

  function applyLoadedSubtasks(loaded: BoardSubTaskSummary[]): void {
    setSubtasks(loaded);
    setAssigneesBaseline(buildAssigneesSnapshot(loaded));
  }

  function handleTaskClick(task: KanbanTask): void {
    setSelectedTask(task);
    setSavingAssignees(false);
    setLoadingSubtasks(true);
    setSubtasks([]);
    setAssigneesBaseline({});
    setCreateOpen(false);
    setSavingCreate(false);

    void (async () => {
      try {
        applyLoadedSubtasks(await loadSubtasks(task.documentId));
      } finally {
        setLoadingSubtasks(false);
      }
    })();
  }

  function handleCloseSubtasksModal(): void {
    setSelectedTask(null);
    setSubtasks([]);
    setAssigneesBaseline({});
    setLoadingSubtasks(false);
    setSavingAssignees(false);
    setCreateOpen(false);
    setSavingCreate(false);
  }

  async function refreshSubtasksList(
    taskDocumentId: string,
    options?: { keepDraftAssignees?: boolean },
  ): Promise<void> {
    const loaded = await loadSubtasks(taskDocumentId);
    if (!options?.keepDraftAssignees) {
      applyLoadedSubtasks(loaded);
      return;
    }

    setSubtasks((current) => mergeLoadedSubtasksWithDraft(loaded, current));
    setAssigneesBaseline((current) => mergeAssigneesBaseline(current, loaded));
  }

  function handleAssigneesChange(
    subtask: BoardSubTaskSummary,
    assignedToIds: string[],
  ): void {
    setSubtasks((current) =>
      current.map((item) =>
        item.documentId === subtask.documentId
          ? {
              ...item,
              assignedTo: resolveAssigneeNames(teams, assignedToIds),
            }
          : item,
      ),
    );
  }

  function handleSaveAssignees(): void {
    if (!selectedTask) return;

    const taskDocumentId = selectedTask.documentId;
    const dirtyUpdates = collectDirtyAssigneeUpdates(
      subtasks,
      assigneesBaseline,
    );
    if (dirtyUpdates.length === 0) return;

    const previous = subtasks;
    const previousBaseline = assigneesBaseline;
    setSavingAssignees(true);

    void (async () => {
      try {
        for (const update of dirtyUpdates) {
          await updateSubtaskAssignees(
            update.documentId,
            taskDocumentId,
            update.assignedToIds,
          );
        }
        setOrderedTasks((current) =>
          current.map((task) =>
            task.documentId === taskDocumentId
              ? {
                  ...task,
                  unassignedSubTaskCount:
                    resolveUnassignedSubTaskCount(subtasks),
                }
              : task,
          ),
        );
        handleCloseSubtasksModal();
      } catch {
        setSubtasks(previous);
        setAssigneesBaseline(previousBaseline);
        setSavingAssignees(false);
      }
    })();
  }

  function handleCreateSubtask(
    values: SubTaskFormInput,
    options: { addToTemplate: boolean },
  ): void {
    if (!selectedTask) return;

    const taskDocumentId = selectedTask.documentId;
    setSavingCreate(true);

    void (async () => {
      try {
        await createSubtask(taskDocumentId, values, options);
        await refreshSubtasksList(taskDocumentId, { keepDraftAssignees: true });
        setOrderedTasks((current) =>
          current.map((task) =>
            task.documentId === taskDocumentId
              ? {
                  ...task,
                  unassignedSubTaskCount:
                    (task.unassignedSubTaskCount ?? 0) +
                    (values.assignedToIds?.length ? 0 : 1),
                }
              : task,
          ),
        );
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
  const dependencyStatusSiblings = subtasks.map((subtask) => ({
    documentId: subtask.documentId,
    status: subtask.status,
  }));
  const selectedTaskDisplayTitle = selectedTask
    ? formatTaskDisplayTitle(selectedTask.qty, selectedTask.name)
    : "";

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <KanbanBoard
          steps={steps}
          tasks={orderedTasks}
          onApplyOrder={handleApplyOrder}
          onTaskClick={handleTaskClick}
        />
      </div>

      <KanbanTaskSubtasksModal
        open={selectedTask !== null}
        taskName={selectedTaskDisplayTitle}
        subtasks={subtasks}
        teams={teams}
        assignWarnMax={assignWarnMax}
        assignedCountByColaboratorId={assignedCountsForUi}
        paymentCurrency={paymentCurrency}
        loading={loadingSubtasks}
        dirty={hasAssigneeDraftChanges(subtasks, assigneesBaseline)}
        saving={savingAssignees}
        onClose={handleCloseSubtasksModal}
        onAssigneesChange={handleAssigneesChange}
        onSave={handleSaveAssignees}
        onAddSubtask={() => setCreateOpen(true)}
      />

      {selectedTask ? (
        <KanbanSubtaskCreateModal
          open={createOpen}
          saving={savingCreate}
          teams={teams}
          dependencyOptions={dependencyOptions}
          dependencyStatusSiblings={dependencyStatusSiblings}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateSubtask}
        />
      ) : null}
    </>
  );
}
