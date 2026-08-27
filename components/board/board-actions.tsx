"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
import type { ActivitySession } from "@/lib/business/task-progress";
import {
  createSubtaskListCacheEntry,
  SubtaskListCache,
  type SubtaskListCacheEntry,
} from "@/lib/board/subtask-list-cache";
import {
  mergeBoardSubtaskLiveState,
  type BoardSubtaskLiveState,
} from "@/lib/board/board-subtask-live";
import {
  LimitedPrefetchQueue,
  PREFETCH_MAX_IN_FLIGHT,
} from "@/lib/board/subtask-prefetch-queue";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { SubtaskPaymentCurrency } from "@/lib/settings/currency-for-subtasks-types";
import { showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/ui/app-toast";

const FINISHED_STATUS = "finished";
const PREFETCH_DEBOUNCE_MS = 200;

function resolveUnassignedSubTaskCount(
  items: readonly BoardSubTaskSummary[],
): number {
  return countUnassignedSubTasks(
    items
      .filter((item) => item.status !== FINISHED_STATUS)
      .map((item) => ({ assignedCount: item.assignedTo.length })),
  );
}

function mergeSessionsIntoSubtasks(
  subtasks: BoardSubTaskSummary[],
  sessionsBySubTask: Record<string, ActivitySession[]>,
): BoardSubTaskSummary[] {
  return subtasks.map((subtask) => {
    const sessions = sessionsBySubTask[subtask.documentId];
    if (!sessions) return subtask;
    return { ...subtask, sessions };
  });
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
  loadSubtaskLive?: (
    taskDocumentId: string,
  ) => Promise<Record<string, BoardSubtaskLiveState>>;
  loadSubtaskSessions?: (
    taskDocumentId: string,
  ) => Promise<Record<string, ActivitySession[]>>;
  loadSubtaskSession?: (
    subTaskDocumentId: string,
  ) => Promise<ActivitySession[]>;
  updateSubtaskAssignees: (
    subtaskDocumentId: string,
    taskDocumentId: string,
    assignedToIds: string[],
    propagateChain?: boolean,
  ) => Promise<void>;
  createSubtask: (
    taskDocumentId: string,
    values: SubTaskFormInput,
  ) => Promise<void>;
  releaseSubtaskFlags?: (subTaskDocumentId: string) => Promise<void>;
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
  loadSubtaskLive,
  loadSubtaskSessions,
  loadSubtaskSession,
  updateSubtaskAssignees,
  createSubtask,
  reorderSubtasks,
  linkSubtask,
  releaseSubtaskFlags,
  assigneePeople = [],
  onSubtasksModalOpenChange,
}: BoardActionsProps) {
  const router = useRouter();
  const tKanban = useTranslations("kanban");
  const tKiosk = useTranslations("kiosk");
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
  const [refreshingSubtasks, setRefreshingSubtasks] = useState(false);
  const [subtasksLoadedAt, setSubtasksLoadedAt] = useState<number | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [reorderingSubtasks, setReorderingSubtasks] = useState(false);
  const nameDirectoryRef = useRef(new Map<string, string>());
  const desiredLinkRef = useRef(new Map<string, boolean>());
  const inFlightLinkRef = useRef(new Set<string>());
  const ackedLinkRef = useRef(new Map<string, boolean>());
  const selectedTaskRef = useRef(selectedTask);
  const openTaskIdRef = useRef<string | null>(null);
  const subtasksRef = useRef(subtasks);
  const assigneesBaselineRef = useRef(assigneesBaseline);
  const subtaskCacheRef = useRef(new SubtaskListCache());
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefetchQueueRef = useRef<LimitedPrefetchQueue | null>(null);
  const sessionsLoadedRef = useRef(false);
  selectedTaskRef.current = selectedTask;
  subtasksRef.current = subtasks;
  assigneesBaselineRef.current = assigneesBaseline;

  const assignedCountsForUi = useMemo(
    () =>
      applyAssigneeDraftDeltasToCounts(
        assignedCountByColaboratorId,
        subtasks,
        assigneesBaseline,
      ),
    [assignedCountByColaboratorId, subtasks, assigneesBaseline],
  );

  function invalidateSubtaskCache(taskDocumentId: string): void {
    subtaskCacheRef.current.invalidate(taskDocumentId);
  }

  function applyCacheEntry(entry: SubtaskListCacheEntry): void {
    applyLoadedSubtasks(entry.subtasks);
    setAssigneesBaseline(entry.assigneesBaseline);
    setSubtasksLoadedAt(entry.loadedAt);
  }

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

  function applyFetchedSubtasks(
    loaded: BoardSubTaskSummary[],
    options?: { keepDraftAssignees?: boolean; taskDocumentId?: string },
  ): void {
    const entry = createSubtaskListCacheEntry(loaded);
    const taskDocumentId =
      options?.taskDocumentId ?? selectedTaskRef.current?.documentId;
    if (taskDocumentId) {
      subtaskCacheRef.current.set(taskDocumentId, entry);
    }
    setSubtasksLoadedAt(entry.loadedAt);
    ingestSubtasksIntoAssigneeDirectory(nameDirectoryRef.current, loaded);

    if (options?.keepDraftAssignees) {
      setSubtasks((current) => mergeLoadedSubtasksWithDraft(loaded, current));
      setAssigneesBaseline((current) => mergeAssigneesBaseline(current, loaded));
      return;
    }

    if (
      hasAssigneeDraftChanges(
        subtasksRef.current,
        assigneesBaselineRef.current,
      )
    ) {
      setSubtasks((current) => mergeLoadedSubtasksWithDraft(loaded, current));
      setAssigneesBaseline((current) => mergeAssigneesBaseline(current, loaded));
      return;
    }

    applyLoadedSubtasks(loaded);
  }

  async function applyLiveState(
    taskDocumentId: string,
    live: Record<string, BoardSubtaskLiveState>,
  ): Promise<void> {
    if (selectedTaskRef.current?.documentId !== taskDocumentId) return;
    setSubtasks((current) => {
      const next = mergeBoardSubtaskLiveState(current, live);
      const cached = subtaskCacheRef.current.get(taskDocumentId);
      if (cached) {
        subtaskCacheRef.current.set(taskDocumentId, {
          ...cached,
          subtasks: next,
        });
      }
      return next;
    });
  }

  async function fetchLiveState(taskDocumentId: string): Promise<void> {
    if (!loadSubtaskLive) return;
    const live = await loadSubtaskLive(taskDocumentId);
    await applyLiveState(taskDocumentId, live);
  }

  async function fetchSubtasks(
    taskDocumentId: string,
    options?: { keepDraftAssignees?: boolean },
  ): Promise<BoardSubTaskSummary[]> {
    const loaded = await loadSubtasks(taskDocumentId);
    if (openTaskIdRef.current !== taskDocumentId) {
      return loaded;
    }
    applyFetchedSubtasks(loaded, { ...options, taskDocumentId });
    void fetchLiveState(taskDocumentId);
    return loaded;
  }

  function handleTaskClick(task: KanbanTask): void {
    onSubtasksModalOpenChange?.(true);
    openTaskIdRef.current = task.documentId;
    selectedTaskRef.current = task;
    setSelectedTask(task);
    setCreateOpen(false);
    setSavingCreate(false);
    sessionsLoadedRef.current = false;
    setLoadingSessions(false);

    const cached = subtaskCacheRef.current.get(task.documentId);
    const hasCachedItems = Boolean(cached && cached.subtasks.length > 0);
    if (cached && hasCachedItems) {
      applyCacheEntry(cached);
      setLoadingSubtasks(false);
      setRefreshingSubtasks(true);
    } else {
      setLoadingSubtasks(true);
      setSubtasks([]);
      setAssigneesBaseline({});
      setSubtasksLoadedAt(null);
    }

    void (async () => {
      try {
        await fetchSubtasks(task.documentId);
      } finally {
        if (openTaskIdRef.current === task.documentId) {
          setLoadingSubtasks(false);
          setRefreshingSubtasks(false);
        }
      }
    })();
  }

  function cancelTaskPrefetch(): void {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = null;
    }
  }

  function prefetchSubtasks(task: KanbanTask): void {
    if (subtaskCacheRef.current.get(task.documentId)) return;
    if (!prefetchQueueRef.current) {
      prefetchQueueRef.current = new LimitedPrefetchQueue(
        PREFETCH_MAX_IN_FLIGHT,
        async (taskDocumentId) => {
          if (subtaskCacheRef.current.get(taskDocumentId)) return;
          const loaded = await loadSubtasks(taskDocumentId);
          if (
            loaded.length > 0 &&
            !subtaskCacheRef.current.get(taskDocumentId)
          ) {
            subtaskCacheRef.current.set(
              taskDocumentId,
              createSubtaskListCacheEntry(loaded),
            );
          }
          if (
            loaded.length > 0 &&
            openTaskIdRef.current === taskDocumentId
          ) {
            applyFetchedSubtasks(loaded, { taskDocumentId });
          }
        },
      );
    }
    prefetchQueueRef.current.enqueue(task.documentId);
  }

  function handleTaskPrefetch(task: KanbanTask): void {
    cancelTaskPrefetch();
    prefetchTimerRef.current = setTimeout(() => {
      prefetchSubtasks(task);
    }, PREFETCH_DEBOUNCE_MS);
  }

  function handleCloseSubtasksModal(options?: {
    keepDraftCache?: boolean;
  }): void {
    const taskId = selectedTaskRef.current?.documentId;
    if (
      !options?.keepDraftCache &&
      taskId &&
      hasAssigneeDraftChanges(subtasksRef.current, assigneesBaselineRef.current)
    ) {
      invalidateSubtaskCache(taskId);
    }
    onSubtasksModalOpenChange?.(false);
    openTaskIdRef.current = null;
    selectedTaskRef.current = null;
    setSelectedTask(null);
    setSubtasks([]);
    setAssigneesBaseline({});
    setLoadingSubtasks(false);
    setRefreshingSubtasks(false);
    setSubtasksLoadedAt(null);
    setLoadingSessions(false);
    sessionsLoadedRef.current = false;
    setCreateOpen(false);
    setSavingCreate(false);
    setReorderingSubtasks(false);
    desiredLinkRef.current.clear();
    inFlightLinkRef.current.clear();
    ackedLinkRef.current.clear();
    cancelTaskPrefetch();
  }

  async function handleLoadSessions(): Promise<void> {
    const taskDocumentId = selectedTaskRef.current?.documentId;
    if (!taskDocumentId || !loadSubtaskSessions || sessionsLoadedRef.current) {
      return;
    }
    sessionsLoadedRef.current = true;
    setLoadingSessions(true);
    try {
      const sessionsBySubTask = await loadSubtaskSessions(taskDocumentId);
      setSubtasks((current) =>
        mergeSessionsIntoSubtasks(current, sessionsBySubTask),
      );
    } finally {
      setLoadingSessions(false);
    }
  }

  async function handleReleaseFlags(
    subTaskDocumentId: string,
  ): Promise<void> {
    const taskDocumentId = selectedTaskRef.current?.documentId;
    if (!taskDocumentId) return;
    try {
      if (!releaseSubtaskFlags) return;
      await releaseSubtaskFlags(subTaskDocumentId);
      const loaded = await loadSubtasks(taskDocumentId);
      applyFetchedSubtasks(loaded, { taskDocumentId });
      showSuccessToast(tKiosk("flagsReleased"));
    } catch {
      showErrorToast(tKiosk("exitFailed"));
    }
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
    invalidateSubtaskCache(taskDocumentId);
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
        invalidateSubtaskCache(taskDocumentId);
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
    invalidateSubtaskCache(taskDocumentId);
    await fetchSubtasks(taskDocumentId, options);
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
    const taskTitle = formatTaskDisplayTitle(
      selectedTask.qty,
      selectedTask.name,
    );
    const snapshot = subtasks;
    const dirtyUpdates = collectDirtyAssigneeUpdates(
      snapshot,
      assigneesBaseline,
    );
    if (dirtyUpdates.length === 0) return;

    const previousUnassigned = orderedTasks.find(
      (task) => task.documentId === taskDocumentId,
    )?.unassignedSubTaskCount;
    const chainItems = chainItemsFromBoard(snapshot);
    const chains = resolveChains(chainItems);
    const ranked = [...dirtyUpdates].sort((left, right) => {
      const leftChain = findChainContaining(chains, left.documentId);
      const rightChain = findChainContaining(chains, right.documentId);
      const leftHead = leftChain?.headId === left.documentId ? 0 : 1;
      const rightHead = rightChain?.headId === right.documentId ? 0 : 1;
      return leftHead - rightHead;
    });

    subtaskCacheRef.current.set(
      taskDocumentId,
      createSubtaskListCacheEntry(snapshot),
    );
    setOrderedTasks((current) =>
      current.map((task) =>
        task.documentId === taskDocumentId
          ? {
              ...task,
              unassignedSubTaskCount: resolveUnassignedSubTaskCount(snapshot),
            }
          : task,
      ),
    );
    handleCloseSubtasksModal({ keepDraftCache: true });

    const saveToastId = showLoadingToast(
      tKanban("taskUpdating", { title: taskTitle }),
    );

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
                const row = snapshot.find((item) => item.documentId === id);
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
        showSuccessToast(tKanban("taskUpdated", { title: taskTitle }), {
          toastId: saveToastId,
        });
      } catch {
        invalidateSubtaskCache(taskDocumentId);
        setOrderedTasks((current) =>
          current.map((task) =>
            task.documentId === taskDocumentId
              ? { ...task, unassignedSubTaskCount: previousUnassigned }
              : task,
          ),
        );
        showErrorToast(tKanban("taskUpdateFailed", { title: taskTitle }), {
          toastId: saveToastId,
        });
      }
    })();
  }

  function handleCreateSubtask(values: SubTaskFormInput): void {
    if (!selectedTask) return;

    const taskDocumentId = selectedTask.documentId;
    invalidateSubtaskCache(taskDocumentId);
    setSavingCreate(true);

    void (async () => {
      try {
        await createSubtask(taskDocumentId, values);
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
          onTaskPrefetch={handleTaskPrefetch}
          onTaskVisiblePrefetch={prefetchSubtasks}
          onTaskPrefetchCancel={cancelTaskPrefetch}
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
        refreshing={refreshingSubtasks}
        loadedAt={subtasksLoadedAt}
        loadingSessions={loadingSessions}
        dirty={hasAssigneeDraftChanges(subtasks, assigneesBaseline)}
        saving={false}
        reordering={reorderingSubtasks}
        onClose={handleCloseSubtasksModal}
        onAssigneesChange={handleAssigneesChange}
        onSave={handleSaveAssignees}
        onReorder={handleReorderSubtasks}
        onLinkToggle={handleLinkToggle}
        onAddSubtask={() => setCreateOpen(true)}
        onLoadSessions={loadSubtaskSessions ? handleLoadSessions : undefined}
        loadSubtaskSession={loadSubtaskSession}
        onReleaseFlags={handleReleaseFlags}
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
