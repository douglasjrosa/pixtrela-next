"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import type { BoardColumnState } from "@/lib/board/board-column-state";
import { flattenBoardColumnTasks } from "@/lib/board/board-column-state";
import type { BoardColumnPageCursor } from "@/lib/board/column-task-page";
import type { BoardTaskRelativeMove } from "@/lib/business/board-task-relative-move";
import type { LoadMoreBoardColumnResult } from "@/components/kanban/kanban-board";
import {
  applyAssigneeDraftDeltasToCounts,
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
  collectDirtyLinkUpdates,
  hasLinkDraftChanges,
  mergeLinksBaseline,
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
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

const FINISHED_STATUS = "finished";
const PREFETCH_DEBOUNCE_MS = 200;
/** Skip a redundant refetch right after a successful background save sync. */
const SUBTASK_POST_SAVE_SKIP_REFETCH_MS = 15_000;

function mergeSavedSnapshotOverStaleLoad(
  loaded: BoardSubTaskSummary[],
  snapshot: readonly BoardSubTaskSummary[],
): BoardSubTaskSummary[] {
  const snapshotById = new Map(
    snapshot.map((item) => [item.documentId, item]),
  );
  return loaded.map((item) => {
    const saved = snapshotById.get(item.documentId);
    if (!saved) return item;
    const loadedAssignees = buildAssigneesSnapshot([item])[item.documentId];
    const savedAssignees = buildAssigneesSnapshot([saved])[item.documentId];
    const assigneesDiffer = loadedAssignees !== savedAssignees;
    const linksDiffer = item.linkedToPrevious !== saved.linkedToPrevious;
    if (!assigneesDiffer && !linksDiffer) return item;
    return {
      ...item,
      assignedTo: saved.assignedTo,
      linkedToPrevious: saved.linkedToPrevious,
    };
  });
}

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
  columns: BoardColumnState[];
  teams: TeamAssignmentOption[];
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
  paymentCurrency: SubtaskPaymentCurrency;
  applyBoardTaskRelativeMove: (
    move: BoardTaskRelativeMove,
  ) => void | Promise<void>;
  loadMoreBoardColumnTasks: (input: {
    stepDocumentId: string;
    cursor: BoardColumnPageCursor | null;
    limit: number;
  }) => Promise<LoadMoreBoardColumnResult>;
  onColumnsChange: (columns: BoardColumnState[]) => void;
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
  onPersistingTaskDocumentIdsChange?: (ids: ReadonlySet<string>) => void;
}

export function BoardActions({
  steps,
  columns,
  teams,
  assignWarnMax,
  assignedCountByColaboratorId,
  paymentCurrency,
  applyBoardTaskRelativeMove,
  loadMoreBoardColumnTasks,
  onColumnsChange,
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
  onPersistingTaskDocumentIdsChange,
}: BoardActionsProps) {
  const tKanban = useTranslations("kanban");
  const tKiosk = useTranslations("kiosk");
  const [, startTransition] = useTransition();
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const orderedTasks = flattenBoardColumnTasks(columns);

  function patchTaskInColumns(
    taskDocumentId: string,
    patch: Partial<KanbanTask>,
  ): void {
    onColumnsChange(
      columnsRef.current.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) =>
          task.documentId === taskDocumentId ? { ...task, ...patch } : task,
        ),
      })),
    );
  }
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [subtasks, setSubtasks] = useState<BoardSubTaskSummary[]>([]);
  const [assigneesBaseline, setAssigneesBaseline] = useState<
    Record<string, string>
  >({});
  const [linksBaseline, setLinksBaseline] = useState<Record<string, boolean>>(
    {},
  );
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [refreshingSubtasks, setRefreshingSubtasks] = useState(false);
  const [subtasksLoadedAt, setSubtasksLoadedAt] = useState<number | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [reorderingSubtasks, setReorderingSubtasks] = useState(false);
  const [persistingTaskDocumentIds, setPersistingTaskDocumentIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const nameDirectoryRef = useRef(new Map<string, string>());
  const selectedTaskRef = useRef(selectedTask);
  const openTaskIdRef = useRef<string | null>(null);
  const subtasksRef = useRef(subtasks);
  const assigneesBaselineRef = useRef(assigneesBaseline);
  const linksBaselineRef = useRef(linksBaseline);
  const subtaskCacheRef = useRef(new SubtaskListCache());
  const subtaskSaveFreshUntilRef = useRef(new Map<string, number>());
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefetchQueueRef = useRef<LimitedPrefetchQueue | null>(null);
  const sessionsLoadedRef = useRef(false);
  const persistingTaskDocumentIdsRef = useRef(persistingTaskDocumentIds);
  selectedTaskRef.current = selectedTask;
  subtasksRef.current = subtasks;
  assigneesBaselineRef.current = assigneesBaseline;
  linksBaselineRef.current = linksBaseline;
  persistingTaskDocumentIdsRef.current = persistingTaskDocumentIds;

  useEffect(() => {
    onPersistingTaskDocumentIdsChange?.(persistingTaskDocumentIds);
  }, [onPersistingTaskDocumentIdsChange, persistingTaskDocumentIds]);

  async function commitSubtaskCacheAfterSave(
    taskDocumentId: string,
    fallbackSnapshot: readonly BoardSubTaskSummary[],
  ): Promise<void> {
    let loaded: BoardSubTaskSummary[] = [...fallbackSnapshot];
    try {
      const fromServer = await loadSubtasks(taskDocumentId);
      loaded = mergeSavedSnapshotOverStaleLoad(fromServer, fallbackSnapshot);
    } catch {
      // Keep optimistic snapshot if the post-save read fails.
    }

    const entry = createSubtaskListCacheEntry(loaded);
    subtaskCacheRef.current.set(taskDocumentId, entry);
    subtaskSaveFreshUntilRef.current.set(
      taskDocumentId,
      entry.loadedAt + SUBTASK_POST_SAVE_SKIP_REFETCH_MS,
    );
    ingestSubtasksIntoAssigneeDirectory(nameDirectoryRef.current, loaded);

    if (openTaskIdRef.current === taskDocumentId) {
      applyLoadedSubtasks(loaded);
      setSubtasksLoadedAt(entry.loadedAt);
    }

    patchTaskInColumns(taskDocumentId, {
      unassignedSubTaskCount: resolveUnassignedSubTaskCount(loaded),
    });
  }

  function shouldSkipSubtaskRefetchAfterSave(taskDocumentId: string): boolean {
    const freshUntil = subtaskSaveFreshUntilRef.current.get(taskDocumentId);
    return freshUntil !== undefined && Date.now() < freshUntil;
  }

  function hasBoardDraftChanges(
    items: readonly BoardSubTaskSummary[],
    assigneeBaseline: Record<string, string>,
    linkBaseline: Record<string, boolean>,
  ): boolean {
    return (
      hasAssigneeDraftChanges(items, assigneeBaseline) ||
      hasLinkDraftChanges(items, linkBaseline)
    );
  }

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
    setLinksBaseline(entry.linksBaseline);
    setSubtasksLoadedAt(entry.loadedAt);
  }

  function handleApplyRelativeMove(move: BoardTaskRelativeMove): void {
    startTransition(() => {
      void (async () => {
        try {
          await applyBoardTaskRelativeMove(move);
        } catch {
          // Optimistic update lives in KanbanBoard; poll C corrects drift.
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
    setSubtasks(loaded);
    setAssigneesBaseline(buildAssigneesSnapshot(loaded));
    setLinksBaseline(
      Object.fromEntries(
        loaded.map((item) => [item.documentId, item.linkedToPrevious]),
      ),
    );
  }

  function applyFetchedSubtasks(
    loaded: BoardSubTaskSummary[],
    options?: { keepDraftAssignees?: boolean; taskDocumentId?: string },
  ): void {
    const entry = createSubtaskListCacheEntry(loaded);
    const taskDocumentId =
      options?.taskDocumentId ?? selectedTaskRef.current?.documentId;
    setSubtasksLoadedAt(entry.loadedAt);
    ingestSubtasksIntoAssigneeDirectory(nameDirectoryRef.current, loaded);

    const shouldMergeDraft =
      options?.keepDraftAssignees ||
      hasBoardDraftChanges(
        subtasksRef.current,
        assigneesBaselineRef.current,
        linksBaselineRef.current,
      );

    if (shouldMergeDraft) {
      const merged = mergeLoadedSubtasksWithDraft(
        loaded,
        subtasksRef.current,
      );
      const nextAssigneeBaseline = mergeAssigneesBaseline(
        assigneesBaselineRef.current,
        loaded,
      );
      const nextLinksBaseline = mergeLinksBaseline(
        linksBaselineRef.current,
        loaded,
      );
      if (taskDocumentId) {
        subtaskCacheRef.current.set(taskDocumentId, {
          ...entry,
          subtasks: merged,
          assigneesBaseline: nextAssigneeBaseline,
          linksBaseline: nextLinksBaseline,
        });
      }
      setSubtasks(merged);
      setAssigneesBaseline(nextAssigneeBaseline);
      setLinksBaseline(nextLinksBaseline);
      return;
    }

    applyLoadedSubtasks(loaded);
    if (taskDocumentId) {
      subtaskCacheRef.current.set(taskDocumentId, entry);
    }
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
    if (persistingTaskDocumentIdsRef.current.has(task.documentId)) {
      return;
    }
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
      setLinksBaseline({});
      setSubtasksLoadedAt(null);
    }

    const skipRefetchAfterSave = shouldSkipSubtaskRefetchAfterSave(
      task.documentId,
    );

    void (async () => {
      try {
        if (skipRefetchAfterSave) {
          void fetchLiveState(task.documentId);
        } else {
          await fetchSubtasks(task.documentId);
        }
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
      hasBoardDraftChanges(
        subtasksRef.current,
        assigneesBaselineRef.current,
        linksBaselineRef.current,
      )
    ) {
      invalidateSubtaskCache(taskId);
    }
    onSubtasksModalOpenChange?.(false);
    openTaskIdRef.current = null;
    selectedTaskRef.current = null;
    setSelectedTask(null);
    setSubtasks([]);
    setAssigneesBaseline({});
    setLinksBaseline({});
    setLoadingSubtasks(false);
    setRefreshingSubtasks(false);
    setSubtasksLoadedAt(null);
    setLoadingSessions(false);
    sessionsLoadedRef.current = false;
    setCreateOpen(false);
    setSavingCreate(false);
    setReorderingSubtasks(false);
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
  }

  function handleLinkToggle(
    subtaskDocumentId: string,
    linkedToPrevious: boolean,
  ): void {
    if (!selectedTaskRef.current) return;
    applyOptimisticLink(subtaskDocumentId, linkedToPrevious);
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
    const dirtyAssigneeUpdates = collectDirtyAssigneeUpdates(
      snapshot,
      assigneesBaseline,
    );
    const dirtyLinkUpdates = collectDirtyLinkUpdates(snapshot, linksBaseline)
      .sort((left, right) => {
        const leftIndex =
          snapshot.find((item) => item.documentId === left.documentId)?.index ??
          0;
        const rightIndex =
          snapshot.find((item) => item.documentId === right.documentId)?.index ??
          0;
        return leftIndex - rightIndex;
      });
    if (dirtyAssigneeUpdates.length === 0 && dirtyLinkUpdates.length === 0) {
      return;
    }

    const previousUnassigned = orderedTasks.find(
      (task) => task.documentId === taskDocumentId,
    )?.unassignedSubTaskCount;
    const chainItems = chainItemsFromBoard(snapshot);
    const chains = resolveChains(chainItems);
    const ranked = [...dirtyAssigneeUpdates].sort((left, right) => {
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
    patchTaskInColumns(taskDocumentId, {
      unassignedSubTaskCount: resolveUnassignedSubTaskCount(snapshot),
    });
    handleCloseSubtasksModal({ keepDraftCache: true });
    setPersistingTaskDocumentIds((current) => {
      const next = new Set(current);
      next.add(taskDocumentId);
      return next;
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
        for (const update of dirtyLinkUpdates) {
          await linkSubtask(
            taskDocumentId,
            update.documentId,
            update.linkedToPrevious,
          );
        }
        await commitSubtaskCacheAfterSave(taskDocumentId, snapshot);
        setPersistingTaskDocumentIds((current) => {
          const next = new Set(current);
          next.delete(taskDocumentId);
          return next;
        });
        showSuccessToast(tKanban("taskUpdated", { title: taskTitle }));
      } catch {
        invalidateSubtaskCache(taskDocumentId);
        patchTaskInColumns(taskDocumentId, {
          unassignedSubTaskCount: previousUnassigned,
        });
        setPersistingTaskDocumentIds((current) => {
          const next = new Set(current);
          next.delete(taskDocumentId);
          return next;
        });
        showErrorToast(tKanban("taskUpdateFailed", { title: taskTitle }));
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
        const current = orderedTasks.find(
          (task) => task.documentId === taskDocumentId,
        );
        patchTaskInColumns(taskDocumentId, {
          unassignedSubTaskCount:
            (current?.unassignedSubTaskCount ?? 0) +
            (values.assignedToIds?.length ? 0 : 1),
        });
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
          columns={columns.map((column) => ({
            stepDocumentId: column.stepDocumentId,
            totalCount: column.totalCount,
            tasks: column.tasks,
            cursor: column.cursor,
          }))}
          columnStates={columns}
          onColumnStatesChange={onColumnsChange}
          onApplyRelativeMove={handleApplyRelativeMove}
          onLoadMoreColumn={loadMoreBoardColumnTasks}
          onTaskClick={handleTaskClick}
          onTaskPrefetch={handleTaskPrefetch}
          onTaskVisiblePrefetch={prefetchSubtasks}
          onTaskPrefetchCancel={cancelTaskPrefetch}
          persistingTaskDocumentIds={persistingTaskDocumentIds}
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
        dirty={hasBoardDraftChanges(subtasks, assigneesBaseline, linksBaseline)}
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
