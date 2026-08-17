"use client";

import { useMemo, useRef, useState, useTransition } from "react";
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
  assigneeIdsKey,
  buildAssigneesSnapshot,
  collectDirtyAssigneeUpdates,
  hasAssigneeDraftChanges,
  ingestAssigneeDirectory,
  ingestSubtasksIntoAssigneeDirectory,
  ingestTeamsIntoAssigneeDirectory,
  mergeAssigneesBaseline,
  mergeAssigneesByIds,
  mergeLoadedSubtasksWithDraft,
} from "@/lib/business/board-assignee-draft";
import {
  shouldFlushBoardLink,
  type BoardSubtaskLinkResult,
} from "@/lib/business/board-link-queue";
import {
  applyChainLinkToggle,
  applyHeadAssigneePropagation,
  applyMaxWorkerSelfAssigneeChange,
  canEditAssignees,
  chainAssigneeStateFromBoard,
  chainItemsFromBoard,
  findChainContaining,
  isMultiMemberChain,
  reconcileChainReorder,
  resolveChains,
  shouldPropagateHeadAssigneeSave,
  type AssigneeApplyScope,
} from "@/lib/business/subtask-chain";
import { countUnassignedSubTasks } from "@/lib/business/kanban-card-badges";
import { formatTaskDisplayTitle } from "@/lib/business/task-display-title";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { SubtaskPaymentCurrency } from "@/lib/settings/currency-for-subtasks-types";

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
    propagateChain?: boolean,
  ) => Promise<void>;
  createSubtask: (
    taskDocumentId: string,
    values: SubTaskFormInput,
    options?: { addToTemplate?: boolean },
  ) => Promise<void>;
  reorderSubtasks: (
    taskDocumentId: string,
    orderedDocumentIds: string[],
    movedDocumentId: string,
  ) => Promise<void>;
  linkSubtask: (
    taskDocumentId: string,
    subtaskDocumentId: string,
    linkedToPrevious: boolean,
  ) => Promise<BoardSubtaskLinkResult>;
  assigneePeople?: { documentId: string; name: string }[];
  onSubtasksModalOpenChange?: (open: boolean) => void;
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
  reorderSubtasks,
  linkSubtask,
  assigneePeople = [],
  onSubtasksModalOpenChange,
}: BoardActionsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [orderedTasks, setOrderedTasks] = useState(tasks);
  const [prevTasks, setPrevTasks] = useState(tasks);
  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    setOrderedTasks(tasks);
  }
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [subtasks, setSubtasks] = useState<BoardSubTaskSummary[]>([]);
  const [assigneesBaseline, setAssigneesBaseline] = useState<
    Record<string, string>
  >({});
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [savingAssignees, setSavingAssignees] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [reorderingSubtasks, setReorderingSubtasks] = useState(false);
  const nameDirectoryRef = useRef(new Map<string, string>());
  const desiredLinkRef = useRef(new Map<string, boolean>());
  const inFlightLinkRef = useRef(new Set<string>());
  const ackedLinkRef = useRef(new Map<string, boolean>());
  const selectedTaskRef = useRef(selectedTask);
  const subtasksRef = useRef(subtasks);
  selectedTaskRef.current = selectedTask;
  subtasksRef.current = subtasks;

  const assignedCountsForUi = useMemo(
    () =>
      applyAssigneeDraftDeltasToCounts(
        assignedCountByColaboratorId,
        subtasks,
        assigneesBaseline,
      ),
    [assignedCountByColaboratorId, subtasks, assigneesBaseline],
  );

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

  function rememberAssigneeNames(
    people: readonly { documentId: string; name?: string | null }[] = [],
  ): void {
    ingestTeamsIntoAssigneeDirectory(nameDirectoryRef.current, teams);
    ingestAssigneeDirectory(nameDirectoryRef.current, assigneePeople);
    ingestAssigneeDirectory(nameDirectoryRef.current, people);
  }

  function applyLoadedSubtasks(loaded: BoardSubTaskSummary[]): void {
    ingestSubtasksIntoAssigneeDirectory(nameDirectoryRef.current, loaded);
    rememberAssigneeNames();
    ackedLinkRef.current.clear();
    desiredLinkRef.current.clear();
    inFlightLinkRef.current.clear();
    for (const item of loaded) {
      ackedLinkRef.current.set(item.documentId, item.linkedToPrevious);
    }
    setSubtasks(loaded);
    setAssigneesBaseline(buildAssigneesSnapshot(loaded));
  }

  function handleTaskClick(task: KanbanTask): void {
    onSubtasksModalOpenChange?.(true);
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
    onSubtasksModalOpenChange?.(false);
    setSelectedTask(null);
    setSubtasks([]);
    setAssigneesBaseline({});
    setLoadingSubtasks(false);
    setSavingAssignees(false);
    setCreateOpen(false);
    setSavingCreate(false);
    setReorderingSubtasks(false);
    desiredLinkRef.current.clear();
    inFlightLinkRef.current.clear();
    ackedLinkRef.current.clear();
  }

  function sortSubtasksByDocumentIds(
    items: BoardSubTaskSummary[],
    orderedDocumentIds: string[],
  ): BoardSubTaskSummary[] {
    const orderMap = new Map(
      orderedDocumentIds.map((documentId, index) => [documentId, index]),
    );
    return [...items].sort(
      (left, right) =>
        (orderMap.get(left.documentId) ?? 0) -
        (orderMap.get(right.documentId) ?? 0),
    );
  }

  function applyChainStatesToSubtasks(
    items: BoardSubTaskSummary[],
    states: ReturnType<typeof chainAssigneeStateFromBoard>,
  ): BoardSubTaskSummary[] {
    const byId = new Map(states.map((state) => [state.documentId, state]));
    rememberAssigneeNames(items.flatMap((item) => item.assignedTo));
    return items.map((item) => {
      const state = byId.get(item.documentId);
      if (!state) return item;
      return {
        ...item,
        linkedToPrevious: state.linkedToPrevious,
        assignedTo: mergeAssigneesByIds(
          item.assignedTo,
          state.assignedToIds,
          nameDirectoryRef.current,
        ),
      };
    });
  }

  function handleReorderSubtasks(
    orderedDocumentIds: string[],
    movedDocumentId: string,
  ): void {
    if (!selectedTask) return;

    const taskDocumentId = selectedTask.documentId;
    const before = subtasks;
    const pending = subtasks.filter((item) => item.status !== FINISHED_STATUS);
    const pendingIds = new Set(pending.map((item) => item.documentId));
    const pendingOrder = orderedDocumentIds.filter((id) => pendingIds.has(id));
    const reconciled = reconcileChainReorder(
      chainAssigneeStateFromBoard(pending),
      pendingOrder,
      movedDocumentId,
    );
    setSubtasks(
      sortSubtasksByDocumentIds(
        applyChainStatesToSubtasks(subtasks, reconciled),
        orderedDocumentIds,
      ).map((item, index) => ({ ...item, index })),
    );
    setReorderingSubtasks(true);

    void (async () => {
      try {
        await reorderSubtasks(
          taskDocumentId,
          orderedDocumentIds,
          movedDocumentId,
        );
      } catch {
        setSubtasks(before);
      } finally {
        setReorderingSubtasks(false);
      }
    })();
  }

  function applyOptimisticLink(
    subtaskDocumentId: string,
    linkedToPrevious: boolean,
  ): void {
    const current = subtasksRef.current;
    const pending = current.filter((item) => item.status !== FINISHED_STATUS);
    const nextStates = applyChainLinkToggle(
      chainAssigneeStateFromBoard(pending),
      subtaskDocumentId,
      linkedToPrevious,
    );
    const next = applyChainStatesToSubtasks(current, nextStates);
    rememberAssigneeNames(next.flatMap((item) => item.assignedTo));
    setSubtasks(next);
    setAssigneesBaseline((baseline) => {
      const updated = { ...baseline };
      for (const item of next) {
        const before = current.find((row) => row.documentId === item.documentId);
        if (!before) continue;
        const beforeKey = assigneeIdsKey(
          before.assignedTo.map((assignee) => assignee.documentId),
        );
        const afterKey = assigneeIdsKey(
          item.assignedTo.map((assignee) => assignee.documentId),
        );
        if (beforeKey !== afterKey) {
          updated[item.documentId] = afterKey;
        }
      }
      return updated;
    });
  }

  async function flushBoardLink(subtaskDocumentId: string): Promise<void> {
    const taskDocumentId = selectedTaskRef.current?.documentId;
    if (!taskDocumentId) return;
    const desired = desiredLinkRef.current.get(subtaskDocumentId);
    if (
      !shouldFlushBoardLink(
        desired,
        inFlightLinkRef.current.has(subtaskDocumentId),
        ackedLinkRef.current.get(subtaskDocumentId),
      ) ||
      desired === undefined
    ) {
      return;
    }

    inFlightLinkRef.current.add(subtaskDocumentId);
    try {
      const result = await linkSubtask(
        taskDocumentId,
        subtaskDocumentId,
        desired,
      );
      rememberAssigneeNames(result.assignedTo);
      ackedLinkRef.current.set(subtaskDocumentId, result.linkedToPrevious);
      const stillWanted = desiredLinkRef.current.get(subtaskDocumentId);
      if (stillWanted === undefined || stillWanted === result.linkedToPrevious) {
        desiredLinkRef.current.delete(subtaskDocumentId);
        setSubtasks((current) =>
          current.map((item) =>
            item.documentId === result.documentId
              ? { ...item, linkedToPrevious: result.linkedToPrevious }
              : item,
          ),
        );
      }
    } catch {
      desiredLinkRef.current.delete(subtaskDocumentId);
      const acked = ackedLinkRef.current.get(subtaskDocumentId) ?? false;
      setSubtasks((current) =>
        current.map((item) =>
          item.documentId === subtaskDocumentId
            ? { ...item, linkedToPrevious: acked }
            : item,
        ),
      );
    } finally {
      inFlightLinkRef.current.delete(subtaskDocumentId);
    }

    if (
      shouldFlushBoardLink(
        desiredLinkRef.current.get(subtaskDocumentId),
        inFlightLinkRef.current.has(subtaskDocumentId),
        ackedLinkRef.current.get(subtaskDocumentId),
      )
    ) {
      await flushBoardLink(subtaskDocumentId);
    }
  }

  function handleLinkToggle(
    subtaskDocumentId: string,
    linkedToPrevious: boolean,
  ): void {
    if (!selectedTaskRef.current) return;
    desiredLinkRef.current.set(subtaskDocumentId, linkedToPrevious);
    applyOptimisticLink(subtaskDocumentId, linkedToPrevious);
    void flushBoardLink(subtaskDocumentId);
  }

  async function refreshSubtasksList(
    taskDocumentId: string,
    options?: { keepDraftAssignees?: boolean },
  ): Promise<void> {
    const loaded = await loadSubtasks(taskDocumentId);
    ingestSubtasksIntoAssigneeDirectory(nameDirectoryRef.current, loaded);
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
    applyScope?: AssigneeApplyScope,
  ): void {
    rememberAssigneeNames(
      subtasksRef.current.flatMap((item) => item.assignedTo),
    );
    setSubtasks((current) => {
      const directory = nameDirectoryRef.current;
      const chainItems = chainItemsFromBoard(current);
      const chain = findChainContaining(
        resolveChains(chainItems),
        subtask.documentId,
      );
      if (!chain || chain.memberIds.length <= 1) {
        return current.map((item) =>
          item.documentId === subtask.documentId
            ? {
                ...item,
                assignedTo: mergeAssigneesByIds(
                  item.assignedTo,
                  assignedToIds,
                  directory,
                ),
              }
            : item,
        );
      }

      const role = canEditAssignees(
        subtask.documentId,
        subtask.maxSameTimeWorkers,
        chain,
      );
      const scope =
        applyScope ??
        (role === "head" ? "group" : role === "helper" ? "self" : undefined);
      if (role === "none" && scope !== "group") return current;
      if (scope === "self") {
        const members = chain.memberIds
          .map((id) => chainItems.find((item) => item.documentId === id))
          .filter((item): item is NonNullable<typeof item> => Boolean(item));
        const nextById = new Map(
          applyMaxWorkerSelfAssigneeChange(
            members,
            subtask.documentId,
            assignedToIds,
          ).map((item) => [item.documentId, item.assignedToIds]),
        );
        return current.map((item) => {
          const nextIds = nextById.get(item.documentId);
          if (!nextIds) return item;
          return {
            ...item,
            assignedTo: mergeAssigneesByIds(
              item.assignedTo,
              nextIds,
              directory,
            ),
          };
        });
      }

      const members = chain.memberIds
        .map((id) => chainItems.find((item) => item.documentId === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      const propagated = applyHeadAssigneePropagation(
        members,
        chain.headId,
        assignedToIds,
      );
      const nextById = new Map(
        propagated.map((item) => [item.documentId, item.assignedToIds]),
      );
      return current.map((item) => {
        const nextIds = nextById.get(item.documentId);
        if (!nextIds) return item;
        return {
          ...item,
          assignedTo: mergeAssigneesByIds(item.assignedTo, nextIds, directory),
        };
      });
    });
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

    const chainItems = chainItemsFromBoard(subtasks);
    const chains = resolveChains(chainItems);
    const ranked = [...dirtyUpdates].sort((left, right) => {
      const leftChain = findChainContaining(chains, left.documentId);
      const rightChain = findChainContaining(chains, right.documentId);
      const leftHead = leftChain?.headId === left.documentId ? 0 : 1;
      const rightHead = rightChain?.headId === right.documentId ? 0 : 1;
      return leftHead - rightHead;
    });

    void (async () => {
      try {
        for (const update of ranked) {
          const chain = findChainContaining(chains, update.documentId);
          const current = chainItems.find(
            (item) => item.documentId === update.documentId,
          );
          if (chain && isMultiMemberChain(chain) && current) {
            const role = canEditAssignees(
              current.documentId,
              current.maxSameTimeWorkers,
              chain,
            );
            if (role === "none") continue;
            if (role === "head") {
              const memberIds = chain.memberIds.map((id) => {
                const row = subtasks.find((item) => item.documentId === id);
                return (
                  row?.assignedTo.map((assignee) => assignee.documentId) ?? []
                );
              });
              await updateSubtaskAssignees(
                update.documentId,
                taskDocumentId,
                update.assignedToIds,
                shouldPropagateHeadAssigneeSave(memberIds, update.assignedToIds),
              );
              continue;
            }
          }
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
        taskQty={selectedTask?.qty ?? 1}
        subtasks={subtasks}
        teams={teams}
        assignWarnMax={assignWarnMax}
        assignedCountByColaboratorId={assignedCountsForUi}
        paymentCurrency={paymentCurrency}
        loading={loadingSubtasks}
        dirty={hasAssigneeDraftChanges(subtasks, assigneesBaseline)}
        saving={savingAssignees}
        reordering={reorderingSubtasks}
        onClose={handleCloseSubtasksModal}
        onAssigneesChange={handleAssigneesChange}
        onSave={handleSaveAssignees}
        onReorder={handleReorderSubtasks}
        onLinkToggle={handleLinkToggle}
        onAddSubtask={() => setCreateOpen(true)}
      />

      {selectedTask ? (
        <KanbanSubtaskCreateModal
          open={createOpen}
          taskName={selectedTaskDisplayTitle}
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
