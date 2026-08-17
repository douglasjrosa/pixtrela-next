"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { CurrencyMediaIcon } from "@/components/currency/currency-media-icon";
import { KanbanTaskSubtasksLoadingBody } from "@/components/kanban/kanban-task-subtasks-loading";
import {
  SUBTASK_CHAIN_LIST_GAP_CLASS,
  SubtaskChainLinkControl,
} from "@/components/kanban/subtask-chain-link-control";
import { SubTaskProgressBar } from "@/components/kanban/subtask-progress-bar";
import { TimeMetrics } from "@/components/kanban/time-metrics";
import { SubTaskSessionsPanel } from "@/components/subtasks/subtask-sessions-panel";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { Button } from "@/components/ui/button";
import { Card, CardBadge, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  FORM_MODAL_PRIMARY_PANEL_MIN_HEIGHT_CLASS,
  FormModalShell,
} from "@/components/ui/form-modal-shell";
import { StackedDateTime } from "@/components/ui/stacked-date-time";
import {
  reorderPendingSubtasksInPlace,
  subtaskDocumentIdsInOrder,
} from "@/lib/business/board-pending-subtask-order";
import {
  isSubtaskAssignedTo,
  splitSubtasksByFinished,
  toggleCollaboratorOnSubtask,
  toggleTeamOnSubtask,
} from "@/lib/business/board-assign-focus";
import { getSubtaskAssigneeIds } from "@/lib/business/board-assignee-draft";
import {
  canEditAssignees,
  chainIdsForClickSelection,
  chainItemsFromBoard,
  findChainContaining,
  isMultiMemberChain,
  nextChainSubtaskClick,
  resolveChains,
  type AssigneeApplyScope,
  type ChainClickSelection,
} from "@/lib/business/subtask-chain";
import {
  buildMultiAssignUpdates,
  buildMultiRemoveUpdates,
  canApplyMultiAssign,
  countMultiSelection,
  isMultiSelectionDirty,
  toggleIdInSet,
  toggleTeamMembersInSelection,
} from "@/lib/business/board-multi-assign";
import { shouldShowAssignWarn } from "@/lib/business/assign-warn";
import {
  KANBAN_PRODUCING_BADGE_CLASS_NAME,
  PRODUCING_STATUS,
} from "@/lib/business/kanban-status-badge";
import { calculateSubtaskPayment } from "@/lib/business/subtask-payment";
import type { ActivitySession } from "@/lib/business/task-progress";
import {
  countSessionParticipants,
  resolveLatestSessionFinishedAt,
} from "@/lib/business/task-progress";
import { splitDateTimePtBr } from "@/lib/format/datetime";
import type { SubtaskPaymentCurrency } from "@/lib/settings/currency-for-subtasks-types";
import {
  showConfirmToast,
  showHintToast,
  showSuccessToast,
} from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

import { KanbanFloatingCountBadge } from "./kanban-floating-count-badge";
import {
  KanbanMultiAssignClearButton,
  KanbanMultiAssignSubmitButton,
  KanbanMultiAssignSwitch,
} from "./kanban-multi-assign-toolbar";
import type { BoardSubTaskSummary } from "./types";

type MainTab = "pending" | "finished";
type FocusMode = "subtasks" | "teams";
type PendingExitAction = "disable-multi" | "go-finished";

const KANBAN_SUBTASK_DND_CONTEXT_ID = "kanban-subtasks-modal-dnd";

/** Pure drag-end resolver for tests and KanbanTaskSubtasksModal. */
export function resolveKanbanPendingSubtaskReorder(
  subtasks: readonly BoardSubTaskSummary[],
  activeId: unknown,
  overId: unknown,
): BoardSubTaskSummary[] | null {
  if (typeof activeId !== "string" || typeof overId !== "string") return null;
  return reorderPendingSubtasksInPlace(subtasks, activeId, overId);
}

const EMPTY_PAYMENT_CURRENCY: SubtaskPaymentCurrency = {
  iconUrl: null,
  currencyPerSecond: 0,
  pluralTitle: "",
};

export interface KanbanTaskSubtasksModalProps {
  open: boolean;
  taskName: string;
  /** Task production quantity (scales qty-sharing target pieces). */
  taskQty?: number;
  subtasks: BoardSubTaskSummary[];
  teams: TeamAssignmentOption[];
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
  paymentCurrency?: SubtaskPaymentCurrency;
  loading: boolean;
  refreshing?: boolean;
  loadedAt?: number | null;
  loadingSessions?: boolean;
  dirty: boolean;
  saving: boolean;
  reordering?: boolean;
  onClose: () => void;
  onAssigneesChange: (
    subtask: BoardSubTaskSummary,
    assignedToIds: string[],
    applyScope?: AssigneeApplyScope,
  ) => void;
  onSave: () => void;
  onReorder?: (
    orderedDocumentIds: string[],
    movedDocumentId: string,
  ) => void | Promise<void>;
  onLinkToggle?: (
    subtaskDocumentId: string,
    linkedToPrevious: boolean,
  ) => void | Promise<void>;
  onAddSubtask?: () => void;
  onLoadSessions?: () => void | Promise<void>;
  loadSubtaskSession?: (
    subTaskDocumentId: string,
  ) => Promise<ActivitySession[]>;
}

function getTeamMemberIds(team: TeamAssignmentOption): string[] {
  return team.members.map((member) => member.documentId);
}

function areAllSelected(ids: string[], value: string[]): boolean {
  return ids.length > 0 && ids.every((id) => value.includes(id));
}

const MIN_SAME_TIME_WORKERS = 1;

function SubTaskCardHeader({
  name,
  status,
  statusLabel,
  workingCount,
  assignedTo,
  producingColaboratorIds,
  maxSameTimeWorkers,
}: {
  name: string;
  status: BoardSubTaskSummary["status"];
  statusLabel: string;
  workingCount: number;
  assignedTo: BoardSubTaskSummary["assignedTo"];
  producingColaboratorIds: readonly string[];
  maxSameTimeWorkers: number;
}) {
  const tKanban = useTranslations("kanban");
  const tSubtasks = useTranslations("subtasks");
  const isProducing = status === PRODUCING_STATUS;
  const showActive = isProducing && workingCount > 0;
  const producingIdSet = new Set(producingColaboratorIds);
  const maxWorkers = Math.max(MIN_SAME_TIME_WORKERS, maxSameTimeWorkers);

  return (
    <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-2">
      <div className="flex w-full min-w-0 flex-col gap-1.5 md:flex-1">
        <span className="font-medium">{name}</span>
        <ul
          className="flex flex-wrap items-center gap-1"
          aria-label={tSubtasks("assignedTo")}
        >
          <li className="me-2 flex min-w-0 items-center">
            <span
              className="inline-flex max-w-full flex-col items-center text-xs"
              aria-label={tSubtasks("maxSameTimeWorkersBadge", {
                count: maxWorkers,
              })}
            >
              <span>{tSubtasks("maxSameTimeWorkersShort")}</span>
              <span className="inline-flex items-center gap-0.5">
                <User aria-hidden className="size-3 shrink-0" />
                <span className="tabular-nums">
                  {tSubtasks("maxSameTimeWorkersTimes", { count: maxWorkers })}
                </span>
              </span>
            </span>
          </li>
          {assignedTo.map((assignee) => {
            const isAssigneeProducing = producingIdSet.has(
              assignee.documentId,
            );
            return (
              <li key={assignee.documentId} className="flex min-w-0 items-center">
                <CardBadge
                  title={assignee.name}
                  className={cn(
                    "max-w-full truncate px-1.5 py-0 text-xs font-medium",
                    isAssigneeProducing
                      ? "border-transparent bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {assignee.name}
                </CardBadge>
              </li>
            );
          })}
        </ul>
      </div>
      <CardBadge
        className={cn(
          "inline-flex w-fit shrink-0 items-center gap-1 self-start md:self-end",
          isProducing && KANBAN_PRODUCING_BADGE_CLASS_NAME,
        )}
        aria-label={
          showActive
            ? tKanban("producingWithActiveColaborators", {
                status: statusLabel,
                count: workingCount,
              })
            : undefined
        }
      >
        {statusLabel}
        {showActive ? (
          <>
            <User aria-hidden className="size-3.5 shrink-0" />
            <span className="tabular-nums">{workingCount}</span>
          </>
        ) : null}
      </CardBadge>
    </div>
  );
}

function SubTaskUnassignedFloatingBadge({
  assignedCount,
}: {
  assignedCount: number;
}) {
  const tKanban = useTranslations("kanban");
  if (assignedCount > 0) return null;

  return (
    <KanbanFloatingCountBadge
      count={1}
      ariaLabel={tKanban("unassignedSubtasksBadge", { count: 1 })}
    />
  );
}

function PendingSubtaskCard({
  subtask,
  highlighted,
  saving,
  statusLabel,
  onClick,
}: {
  subtask: BoardSubTaskSummary;
  highlighted: boolean;
  saving: boolean;
  statusLabel: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={highlighted}
        disabled={saving}
        className={cn(
          "relative w-full rounded-lg border p-3 text-left transition-colors",
          highlighted
            ? "border-primary bg-primary/5"
            : "bg-background hover:bg-muted/40",
          saving && "opacity-50",
        )}
        onClick={onClick}
      >
        <SubTaskUnassignedFloatingBadge assignedCount={subtask.assignedTo.length} />
        <SubTaskCardHeader
          name={subtask.name}
          status={subtask.status}
          statusLabel={statusLabel}
          workingCount={subtask.openActivityStartedAts.length}
          assignedTo={subtask.assignedTo}
          producingColaboratorIds={subtask.producingColaboratorIds}
          maxSameTimeWorkers={subtask.maxSameTimeWorkers}
        />
        <SubTaskProgressBar
          status={subtask.status}
          expectedTime={subtask.expectedTime}
          timeSpent={subtask.timeSpent}
          openActivityStartedAts={subtask.openActivityStartedAts}
        />
      </button>
    </li>
  );
}

interface SortablePendingSubtaskCardProps {
  subtask: BoardSubTaskSummary;
  highlighted: boolean;
  dragDisabled: boolean;
  saving: boolean;
  dragLabel: string;
  statusLabel: string;
  showLinkColumn?: boolean;
  showLinkButton?: boolean;
  onLinkToggle?: (linked: boolean) => void;
  linkLabel?: string;
  unlinkLabel?: string;
  onClick: () => void;
}

function SortablePendingSubtaskCard({
  subtask,
  highlighted,
  dragDisabled,
  saving,
  dragLabel,
  statusLabel,
  showLinkColumn = false,
  showLinkButton = false,
  onLinkToggle,
  linkLabel = "",
  unlinkLabel = "",
  onClick,
}: SortablePendingSubtaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subtask.documentId,
    disabled: dragDisabled,
  });

  const style = {
    ...(transform
      ? { transform: CSS.Transform.toString(transform) }
      : {}),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn("overflow-visible", isDragging && "opacity-80")}
    >
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          className={cn(
            "flex shrink-0 items-center rounded-lg border border-transparent px-1",
            "text-muted-foreground hover:text-foreground",
            dragDisabled
              ? "cursor-not-allowed opacity-40"
              : "cursor-grab active:cursor-grabbing",
          )}
          aria-label={dragLabel}
          disabled={dragDisabled}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        {showLinkColumn ? (
          <SubtaskChainLinkControl
            linked={subtask.linkedToPrevious}
            showButton={showLinkButton}
            hidden={isDragging}
            disabled={saving}
            linkLabel={linkLabel}
            unlinkLabel={unlinkLabel}
            onToggle={(linked) => onLinkToggle?.(linked)}
          />
        ) : null}
        <div className="relative z-10 min-w-0 flex-1">
          <button
            type="button"
            aria-pressed={highlighted}
            disabled={saving}
            className={cn(
              "relative w-full rounded-lg border p-3 text-left transition-colors",
              highlighted
                ? "border-primary bg-primary/5"
                : "bg-background hover:bg-muted/40",
              saving && "opacity-50",
            )}
            onClick={onClick}
          >
            <SubTaskUnassignedFloatingBadge
              assignedCount={subtask.assignedTo.length}
            />
            <SubTaskCardHeader
              name={subtask.name}
              status={subtask.status}
              statusLabel={statusLabel}
              workingCount={subtask.openActivityStartedAts.length}
              assignedTo={subtask.assignedTo}
              producingColaboratorIds={subtask.producingColaboratorIds}
              maxSameTimeWorkers={subtask.maxSameTimeWorkers}
            />
            <SubTaskProgressBar
              status={subtask.status}
              expectedTime={subtask.expectedTime}
              timeSpent={subtask.timeSpent}
              openActivityStartedAts={subtask.openActivityStartedAts}
            />
          </button>
        </div>
      </div>
    </li>
  );
}

export function KanbanTaskSubtasksModal({
  open,
  taskName,
  taskQty = 1,
  subtasks,
  teams,
  assignWarnMax,
  assignedCountByColaboratorId,
  paymentCurrency = EMPTY_PAYMENT_CURRENCY,
  loading,
  refreshing = false,
  loadedAt = null,
  loadingSessions = false,
  dirty,
  saving,
  reordering = false,
  onClose,
  onAssigneesChange,
  onSave,
  onReorder,
  onLinkToggle,
  onAddSubtask,
  onLoadSessions,
  loadSubtaskSession,
}: KanbanTaskSubtasksModalProps) {
  const tCommon = useTranslations("common");
  const tKanban = useTranslations("kanban");
  const tStatus = useTranslations("tasks.status");
  const tSubtasks = useTranslations("subtasks");
  const tBalance = useTranslations("balance");

  const [mainTab, setMainTab] = useState<MainTab>("pending");
  const [preferFinishedTab, setPreferFinishedTab] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusMode>("subtasks");
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(
    null,
  );
  const [chainClickSelection, setChainClickSelection] =
    useState<ChainClickSelection | null>(null);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<
    string | null
  >(null);
  const [multiEnabled, setMultiEnabled] = useState(false);
  const [selectedSubtaskIds, setSelectedSubtaskIds] = useState<string[]>([]);
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState<
    string[]
  >([]);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [pendingExitAction, setPendingExitAction] =
    useState<PendingExitAction | null>(null);
  const [infoSubtask, setInfoSubtask] = useState<BoardSubTaskSummary | null>(
    null,
  );
  const [infoSessions, setInfoSessions] = useState<ActivitySession[] | null>(
    null,
  );
  const [infoSessionsLoading, setInfoSessionsLoading] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  function closeInfoPanel(): void {
    setInfoSubtask(null);
    setInfoSessions(null);
    setInfoSessionsLoading(false);
  }

  function openInfoPanel(subtask: BoardSubTaskSummary): void {
    setInfoSubtask(subtask);
    setInfoSessions(null);
    setInfoSessionsLoading(Boolean(loadSubtaskSession));
  }

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setFocusMode("subtasks");
      setSelectedSubtaskId(null);
      setChainClickSelection(null);
      setSelectedCollaboratorId(null);
      setMultiEnabled(false);
      setSelectedSubtaskIds([]);
      setSelectedCollaboratorIds([]);
      setExitConfirmOpen(false);
      setPendingExitAction(null);
      closeInfoPanel();
      setMainTab("pending");
      setPreferFinishedTab(false);
    }
  }

  const { pending, finished } = splitSubtasksByFinished(subtasks);
  const showInitialLoading = loading && subtasks.length === 0;

  useEffect(() => {
    if (!infoSubtask || !loadSubtaskSession) return;
    let cancelled = false;
    void loadSubtaskSession(infoSubtask.documentId).then((sessions) => {
      if (!cancelled) {
        setInfoSessions(sessions);
        setInfoSessionsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [infoSubtask, loadSubtaskSession]);

  const refreshStatusTime = loadedAt
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(loadedAt))
    : null;

  function requestFinishedTab(): void {
    void onLoadSessions?.();
  }

  const shouldLoadFinishedSessions =
    open &&
    finished.length > 0 &&
    (pending.length === 0 || preferFinishedTab || mainTab === "finished");

  useEffect(() => {
    if (!shouldLoadFinishedSessions) return;
    void onLoadSessions?.();
  }, [shouldLoadFinishedSessions, onLoadSessions]);

  const pendingSubtaskIds = useMemo(
    () => pending.map((item) => item.documentId),
    [pending],
  );
  const chainItems = useMemo(
    () => chainItemsFromBoard(subtasks),
    [subtasks],
  );
  const chains = useMemo(() => resolveChains(chainItems), [chainItems]);

  function assigneeRoleFor(documentId: string): "head" | "helper" | "none" | "solo" {
    const chain = findChainContaining(chains, documentId);
    const current = chainItems.find((item) => item.documentId === documentId);
    if (!chain || chain.memberIds.length <= 1 || !current) return "solo";
    return canEditAssignees(
      current.documentId,
      current.maxSameTimeWorkers,
      chain,
    );
  }

  const dragDisabled =
    !onReorder || multiEnabled || saving || loading || reordering;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!onReorder) return;
      const next = resolveKanbanPendingSubtaskReorder(
        subtasks,
        event.active.id,
        event.over?.id,
      );
      if (!next) return;
      void onReorder(
        subtaskDocumentIdsInOrder(next),
        String(event.active.id),
      );
    },
    [onReorder, subtasks],
  );

  if (!open) return null;

  const hasPendingSubtasks = pending.length > 0;
  const hasFinishedSubtasks = finished.length > 0;
  if (!hasFinishedSubtasks && preferFinishedTab) {
    setPreferFinishedTab(false);
  }
  const activeMainTab: MainTab = !hasFinishedSubtasks
    ? "pending"
    : !hasPendingSubtasks
      ? "finished"
      : preferFinishedTab
        ? "finished"
        : mainTab;
  const showMultiAssignSwitch =
    (hasPendingSubtasks || loading) && activeMainTab === "pending";
  const selectedSubtask =
    pending.find((item) => item.documentId === selectedSubtaskId) ?? null;
  const selectedAssigneeRole = selectedSubtask
    ? assigneeRoleFor(selectedSubtask.documentId)
    : "solo";
  const selectedApplyScope: AssigneeApplyScope | undefined =
    chainClickSelection?.scope ??
    (selectedAssigneeRole === "head"
      ? "group"
      : selectedAssigneeRole === "helper"
        ? "self"
        : undefined);
  const selectedAssigneeLocked =
    selectedSubtask != null &&
    selectedAssigneeRole === "none" &&
    selectedApplyScope !== "group";
  const selectedHelperSelfLocked =
    selectedSubtask != null &&
    selectedAssigneeRole === "helper" &&
    selectedApplyScope === "self";
  const selectedChain = selectedSubtask
    ? findChainContaining(chains, selectedSubtask.documentId)
    : null;
  const selectedHeadAssignees = (() => {
    if (!selectedHelperSelfLocked || !selectedChain) return [];
    const head = pending.find(
      (item) => item.documentId === selectedChain.headId,
    );
    return head ? getSubtaskAssigneeIds(head) : [];
  })();
  const selectedHeadAssigneeIdSet = new Set(selectedHeadAssignees);
  const selectedAssigneeIds = selectedSubtask
    ? getSubtaskAssigneeIds(selectedSubtask)
    : [];
  const canApply = canApplyMultiAssign(
    selectedSubtaskIds,
    selectedCollaboratorIds,
  );
  const multiDirty = isMultiSelectionDirty(
    multiEnabled,
    selectedSubtaskIds,
    selectedCollaboratorIds,
  );

  function clearMultiState(): void {
    setMultiEnabled(false);
    setSelectedSubtaskIds([]);
    setSelectedCollaboratorIds([]);
    setSelectedSubtaskId(null);
    setChainClickSelection(null);
    setSelectedCollaboratorId(null);
  }

  function requestExitMulti(action: PendingExitAction): void {
    if (multiDirty) {
      setPendingExitAction(action);
      setExitConfirmOpen(true);
      return;
    }
    applyExitAction(action);
  }

  function applyExitAction(action: PendingExitAction): void {
    clearMultiState();
    if (action === "go-finished") {
      setPreferFinishedTab(true);
      requestFinishedTab();
      setMainTab("finished");
    }
    setExitConfirmOpen(false);
    setPendingExitAction(null);
  }

  function handleExitConfirmYes(): void {
    if (pendingExitAction) {
      applyExitAction(pendingExitAction);
    }
  }

  function handleExitConfirmNo(): void {
    setExitConfirmOpen(false);
    setPendingExitAction(null);
  }

  function confirmIfDirty(onProceed: () => void): void {
    if (!dirty) {
      onProceed();
      return;
    }
    showConfirmToast({
      message: tKanban("exitUnsavedConfirm"),
      yesLabel: tCommon("yes"),
      noLabel: tCommon("no"),
      onYes: onProceed,
    });
  }

  function handleMultiEnabledChange(enabled: boolean): void {
    // Toggle resets local multi/focus UI only. Committed assignee drafts
    // (1:1 clicks or "Assign Subtasks") stay in parent state.
    if (!enabled) {
      clearMultiState();
      return;
    }
    setMultiEnabled(true);
    setSelectedSubtaskIds([]);
    setSelectedCollaboratorIds([]);
    setSelectedSubtaskId(null);
    setChainClickSelection(null);
    setSelectedCollaboratorId(null);
  }

  function handleMainTabChange(next: MainTab): void {
    if (next !== "finished") {
      setPreferFinishedTab(false);
      setMainTab(next);
      return;
    }
    const goFinished = (): void => {
      setPreferFinishedTab(true);
      requestFinishedTab();
      if (multiEnabled) {
        applyExitAction("go-finished");
        return;
      }
      setMainTab("finished");
    };
    if (dirty) {
      confirmIfDirty(goFinished);
      return;
    }
    if (multiEnabled) {
      requestExitMulti("go-finished");
      return;
    }
    goFinished();
  }

  function handleAddSubtask(): void {
    if (!onAddSubtask) return;
    confirmIfDirty(onAddSubtask);
  }

  function renderAddSubtaskButton(className?: string): ReactNode {
    if (!onAddSubtask) return null;
    return (
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled={saving || loading}
        onClick={handleAddSubtask}
      >
        {tKanban("addSubtask")}
      </Button>
    );
  }

  function handleFocusModeChange(next: FocusMode): void {
    if (multiEnabled) return;
    setFocusMode(next);
    setSelectedSubtaskId(null);
    setChainClickSelection(null);
    setSelectedCollaboratorId(null);
  }

  function requestClose(): void {
    confirmIfDirty(onClose);
  }

  function emitAssigneesChange(
    source: BoardSubTaskSummary,
    assignedToIds: string[],
  ): void {
    const chain = findChainContaining(chains, source.documentId);
    if (!chain || !isMultiMemberChain(chain)) {
      onAssigneesChange(source, assignedToIds);
      return;
    }
    const applyScope = selectedApplyScope ?? "self";
    const target =
      applyScope === "group"
        ? (pending.find((item) => item.documentId === chain.headId) ?? source)
        : source;
    onAssigneesChange(target, assignedToIds, applyScope);
  }

  function handlePendingSubtaskClick(subtask: BoardSubTaskSummary): void {
    if (multiEnabled) {
      setSelectedSubtaskIds((current) =>
        toggleIdInSet(current, subtask.documentId),
      );
      return;
    }

    if (focusMode === "subtasks") {
      const chain = findChainContaining(chains, subtask.documentId);
      if (chain && isMultiMemberChain(chain)) {
        const next = nextChainSubtaskClick({
          clickedId: subtask.documentId,
          clickedMaxWorkers: subtask.maxSameTimeWorkers,
          current: chainClickSelection,
        });
        setChainClickSelection(next);
        setSelectedSubtaskId(next?.selectedId ?? null);
        return;
      }
      setChainClickSelection(null);
      setSelectedSubtaskId((current) =>
        current === subtask.documentId ? null : subtask.documentId,
      );
      return;
    }

    if (!selectedCollaboratorId) {
      showHintToast(tKanban("chooseCollaboratorFirst"));
      return;
    }
    if (assigneeRoleFor(subtask.documentId) === "none") {
      showHintToast(tKanban("assigneesFollowHead"));
      return;
    }
    const nextIds = toggleCollaboratorOnSubtask(
      getSubtaskAssigneeIds(subtask),
      selectedCollaboratorId,
    );
    onAssigneesChange(subtask, nextIds);
  }

  function handleCollaboratorClick(collaboratorId: string): void {
    if (multiEnabled) {
      setSelectedCollaboratorIds((current) =>
        toggleIdInSet(current, collaboratorId),
      );
      return;
    }

    if (focusMode === "teams") {
      setSelectedCollaboratorId((current) =>
        current === collaboratorId ? null : collaboratorId,
      );
      return;
    }

    if (!selectedSubtask) {
      showHintToast(tKanban("chooseSubtaskFirst"));
      return;
    }
    if (selectedAssigneeLocked) {
      showHintToast(tKanban("assigneesFollowHead"));
      return;
    }
    const nextIds = toggleCollaboratorOnSubtask(
      getSubtaskAssigneeIds(selectedSubtask),
      collaboratorId,
    );
    emitAssigneesChange(selectedSubtask, nextIds);
  }

  function handleTeamClick(team: TeamAssignmentOption): void {
    const teamIds = getTeamMemberIds(team);
    if (multiEnabled) {
      setSelectedCollaboratorIds((current) =>
        toggleTeamMembersInSelection(current, teamIds),
      );
      return;
    }

    if (focusMode === "teams") return;
    if (!selectedSubtask) {
      showHintToast(tKanban("chooseSubtaskFirst"));
      return;
    }
    if (selectedAssigneeLocked) {
      showHintToast(tKanban("assigneesFollowHead"));
      return;
    }
    const nextIds = toggleTeamOnSubtask(
      getSubtaskAssigneeIds(selectedSubtask),
      teamIds,
    );
    emitAssigneesChange(selectedSubtask, nextIds);
  }

  function applyUpdates(
    updates: ReturnType<typeof buildMultiAssignUpdates>,
  ): void {
    for (const update of updates) {
      const subtask = subtasks.find(
        (item) => item.documentId === update.documentId,
      );
      if (!subtask) continue;
      onAssigneesChange(subtask, update.assignedToIds);
    }
  }

  function handleMultiAssign(): void {
    const counts = countMultiSelection(
      selectedSubtaskIds,
      selectedCollaboratorIds,
    );
    applyUpdates(
      buildMultiAssignUpdates(
        pending,
        selectedSubtaskIds,
        selectedCollaboratorIds,
      ),
    );
    showSuccessToast(
      tKanban("multiAssignToast", {
        subtaskCount: counts.subtaskCount,
        collaboratorCount: counts.collaboratorCount,
      }),
    );
    clearMultiState();
  }

  function handleMultiRemove(): void {
    const counts = countMultiSelection(
      selectedSubtaskIds,
      selectedCollaboratorIds,
    );
    applyUpdates(
      buildMultiRemoveUpdates(
        pending,
        selectedSubtaskIds,
        selectedCollaboratorIds,
      ),
    );
    showSuccessToast(
      tKanban("multiRemoveToast", {
        subtaskCount: counts.subtaskCount,
        collaboratorCount: counts.collaboratorCount,
      }),
    );
    clearMultiState();
  }

  function isPendingSubtaskHighlighted(subtask: BoardSubTaskSummary): boolean {
    if (multiEnabled) {
      return selectedSubtaskIds.includes(subtask.documentId);
    }
    if (focusMode === "subtasks") {
      if (chainClickSelection) {
        return chainIdsForClickSelection(chains, chainClickSelection).includes(
          subtask.documentId,
        );
      }
      return subtask.documentId === selectedSubtaskId;
    }
    if (!selectedCollaboratorId) return false;
    return isSubtaskAssignedTo(subtask, selectedCollaboratorId);
  }

  function isCollaboratorActive(collaboratorId: string): boolean {
    if (multiEnabled) {
      return selectedCollaboratorIds.includes(collaboratorId);
    }
    if (focusMode === "teams") {
      return collaboratorId === selectedCollaboratorId;
    }
    return selectedAssigneeIds.includes(collaboratorId);
  }

  const teamsColumnLooksIdle =
    !multiEnabled && focusMode === "subtasks" && selectedSubtaskId === null;

  const infoPayment = infoSubtask
    ? calculateSubtaskPayment(
        infoSubtask.expectedTime,
        paymentCurrency.currencyPerSecond,
      )
    : 0;

  return (
    <>
      <FormModalShell
        open
        title={tKanban("subtasksTitle")}
        titleId="kanban-subtasks-title"
        onClose={requestClose}
        disabled={saving}
        size="xl"
        layout="viewport"
        footerStart={
          multiEnabled && showMultiAssignSwitch ? (
            <KanbanMultiAssignClearButton
              canApply={canApply}
              disabled={saving}
              onRemove={handleMultiRemove}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={requestClose}
            >
              {tCommon("cancel")}
            </Button>
          )
        }
        footerEnd={
          multiEnabled && showMultiAssignSwitch ? (
            <KanbanMultiAssignSubmitButton
              canApply={canApply}
              disabled={saving}
              onAssign={handleMultiAssign}
            />
          ) : (
            <Button type="button" disabled={!dirty || saving} onClick={onSave}>
              {tCommon("save")}
            </Button>
          )
        }
      >
        <p className="text-sm text-muted-foreground">{taskName}</p>
        {refreshing ? (
          <p className="text-xs text-muted-foreground" role="status">
            {tKanban("refreshingSubtasks")}
          </p>
        ) : refreshStatusTime ? (
          <p className="text-xs text-muted-foreground" role="status">
            {tKanban("subtasksUpdatedAt", { time: refreshStatusTime })}
          </p>
        ) : null}

        {hasPendingSubtasks || hasFinishedSubtasks || loading ? (
          <div className="flex items-center justify-between gap-4 border-b">
            <div
              role="tablist"
              aria-label={tKanban("subtasksTitle")}
              className="flex gap-4"
            >
              {hasPendingSubtasks || loading ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMainTab === "pending"}
                  className={cn(
                    "border-b-2 px-1 pb-2 text-sm font-medium transition-colors",
                    activeMainTab === "pending"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => handleMainTabChange("pending")}
                >
                  {tKanban("pendingTab")}
                </button>
              ) : null}
              {hasFinishedSubtasks ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMainTab === "finished"}
                  className={cn(
                    "border-b-2 px-1 pb-2 text-sm font-medium transition-colors",
                    activeMainTab === "finished"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => handleMainTabChange("finished")}
                >
                  {tKanban("finishedTab")}
                </button>
              ) : null}
            </div>
            {showMultiAssignSwitch ? (
              <KanbanMultiAssignSwitch
                multiEnabled={multiEnabled}
                disabled={saving || loading}
                className="pb-2"
                onMultiEnabledChange={handleMultiEnabledChange}
              />
            ) : null}
          </div>
        ) : null}

        {showInitialLoading ? (
          <>
            <KanbanTaskSubtasksLoadingBody
              teams={teams}
              assignWarnMax={assignWarnMax}
              assignedCountByColaboratorId={assignedCountByColaboratorId}
            />
            {renderAddSubtaskButton("w-full sm:w-auto")}
          </>
        ) : subtasks.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground" role="status">
              {tKanban("subtasksEmpty")}
            </p>
            {renderAddSubtaskButton("w-full sm:w-auto")}
          </div>
        ) : activeMainTab === "finished" ? (
          <ul
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2.5",
              FORM_MODAL_PRIMARY_PANEL_MIN_HEIGHT_CLASS,
            )}
          >
            {finished.length === 0 ? (
              <li className="text-sm text-muted-foreground" role="status">
                {tKanban("subtasksEmpty")}
              </li>
            ) : (
              finished.map((subtask) => {
                const sessionsPending =
                  loadingSessions && subtask.sessions.length === 0;
                const participantCount = countSessionParticipants(
                  subtask.sessions,
                );
                const finishedAt = resolveLatestSessionFinishedAt(
                  subtask.sessions,
                );
                const finishedParts = finishedAt
                  ? splitDateTimePtBr(finishedAt)
                  : null;
                return (
                  <li key={subtask.documentId}>
                    <button
                      type="button"
                      className={cn(
                        "relative w-full rounded-lg border bg-background p-3",
                        "text-left transition-colors hover:bg-muted/40",
                      )}
                      onClick={() => openInfoPanel(subtask)}
                    >
                      <SubTaskUnassignedFloatingBadge
                        assignedCount={subtask.assignedTo.length}
                      />
                      <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0 flex-1 font-medium">
                          {subtask.name}
                        </span>
                        {sessionsPending ? (
                          <span
                            className="text-xs text-muted-foreground"
                            role="status"
                          >
                            {tSubtasks("sessionsLoading")}
                          </span>
                        ) : (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground"
                            aria-label={tKanban("finishedParticipants", {
                              count: participantCount,
                            })}
                          >
                            <Users className="size-3.5 shrink-0" aria-hidden />
                            <span>{participantCount}</span>
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        <TimeMetrics
                          expectedTime={subtask.expectedTime}
                          timeSpent={subtask.timeSpent}
                        />
                        {sessionsPending ? null : finishedAt && finishedParts ? (
                          <StackedDateTime
                            value={finishedAt}
                            className="text-xs text-muted-foreground"
                            aria-label={tKanban("finishedAt", {
                              date: finishedParts.date,
                              time: finishedParts.time,
                            })}
                          />
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })
            )}
            {renderAddSubtaskButton("w-full")}
          </ul>
        ) : (
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col gap-4",
              FORM_MODAL_PRIMARY_PANEL_MIN_HEIGHT_CLASS,
            )}
          >
            <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[7fr_3fr] gap-4">
              <section className="flex min-h-0 min-w-0 flex-col gap-2">
                {multiEnabled ? (
                  <p className="text-sm font-semibold text-foreground">
                    {tKanban("subtasksColumn")}
                  </p>
                ) : (
                  <button
                    type="button"
                    aria-pressed={focusMode === "subtasks"}
                    className={cn(
                      "text-left text-sm font-semibold transition-colors",
                      focusMode === "subtasks"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => handleFocusModeChange("subtasks")}
                  >
                    {tKanban("subtasksColumn")}
                  </button>
                )}
                <ul
                  className={cn(
                    "flex min-h-0 flex-1 flex-col overflow-y-auto pt-2 pr-2.5",
                    onReorder && onLinkToggle
                      ? SUBTASK_CHAIN_LIST_GAP_CLASS
                      : "gap-3",
                  )}
                >
                  {pending.length === 0 ? (
                    <li className="text-sm text-muted-foreground" role="status">
                      {tKanban("subtasksEmpty")}
                    </li>
                  ) : !onReorder ? (
                    pending.map((subtask) => {
                      const highlighted = isPendingSubtaskHighlighted(subtask);
                      return (
                        <PendingSubtaskCard
                          key={subtask.documentId}
                          subtask={subtask}
                          highlighted={highlighted}
                          saving={saving}
                          statusLabel={tStatus(subtask.status)}
                          onClick={() => handlePendingSubtaskClick(subtask)}
                        />
                      );
                    })
                  ) : (
                    <DndContext
                      id={KANBAN_SUBTASK_DND_CONTEXT_ID}
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={pendingSubtaskIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {pending.map((subtask, index) => {
                          const highlighted =
                            isPendingSubtaskHighlighted(subtask);
                          return (
                            <SortablePendingSubtaskCard
                              key={subtask.documentId}
                              subtask={subtask}
                              highlighted={highlighted}
                              dragDisabled={dragDisabled}
                              saving={saving}
                              dragLabel={tSubtasks("dragToReorder")}
                              statusLabel={tStatus(subtask.status)}
                              showLinkColumn={Boolean(onLinkToggle)}
                              showLinkButton={Boolean(onLinkToggle) && index > 0}
                              linkLabel={tKanban("linkToPrevious")}
                              unlinkLabel={tKanban("unlinkFromPrevious")}
                              onLinkToggle={(linked) =>
                                onLinkToggle?.(subtask.documentId, linked)
                              }
                              onClick={() =>
                                handlePendingSubtaskClick(subtask)
                              }
                            />
                          );
                        })}
                      </SortableContext>
                    </DndContext>
                  )}
                  {renderAddSubtaskButton("w-full shrink-0")}
                </ul>
              </section>

              <section className="flex min-h-0 min-w-0 flex-col gap-2">
                {multiEnabled ? (
                  <p className="text-sm font-semibold text-foreground">
                    {tKanban("teamsColumn")}
                  </p>
                ) : (
                  <button
                    type="button"
                    aria-pressed={focusMode === "teams"}
                    className={cn(
                      "text-left text-sm font-semibold transition-colors",
                      focusMode === "teams"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => handleFocusModeChange("teams")}
                  >
                    {tKanban("teamsColumn")}
                  </button>
                )}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto pr-2.5">
                  {teams.map((team) => {
                    const teamIds = getTeamMemberIds(team);
                    const teamAllSelected = multiEnabled
                      ? areAllSelected(teamIds, selectedCollaboratorIds)
                      : focusMode === "subtasks" &&
                        areAllSelected(teamIds, selectedAssigneeIds);
                    const showTeamAsButton =
                      multiEnabled || focusMode === "subtasks";

                    return (
                      <Card key={team.documentId} className="min-w-0 shadow-sm">
                        {showTeamAsButton ? (
                          <button
                            type="button"
                            className={cn(
                              "w-full px-3 pt-3 text-left text-xs font-medium",
                              (!multiEnabled &&
                                (teamsColumnLooksIdle ||
                                  teamIds.length === 0)) ||
                                (multiEnabled && teamIds.length === 0)
                                ? "cursor-default text-muted-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            disabled={saving || teamIds.length === 0}
                            aria-pressed={teamAllSelected}
                            aria-label={tSubtasks("toggleTeamMembers", {
                              team: team.name,
                            })}
                            onClick={() => handleTeamClick(team)}
                          >
                            {team.name}
                          </button>
                        ) : (
                          <p className="px-3 pt-3 text-xs font-medium text-muted-foreground">
                            {team.name}
                          </p>
                        )}
                        <CardContent className="flex min-w-0 flex-wrap gap-2 px-3 pb-3 pt-2">
                          {team.members.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              {tSubtasks("noTeamMembers")}
                            </span>
                          ) : (
                            team.members.map((member) => {
                              const active = isCollaboratorActive(
                                member.documentId,
                              );
                              const assignedCount =
                                assignedCountByColaboratorId[
                                  member.documentId
                                ] ?? 0;
                              const showAssignWarn = shouldShowAssignWarn(
                                assignedCount,
                                assignWarnMax,
                              );
                              const locksHeadAssignee =
                                selectedHelperSelfLocked &&
                                selectedHeadAssigneeIdSet.has(
                                  member.documentId,
                                );
                              const memberDisabled =
                                saving ||
                                (!multiEnabled &&
                                  focusMode === "subtasks" &&
                                  (selectedAssigneeLocked ||
                                    locksHeadAssignee));
                              return (
                                <button
                                  key={member.documentId}
                                  type="button"
                                  className="relative max-w-full min-w-0"
                                  disabled={memberDisabled}
                                  aria-pressed={active}
                                  aria-label={
                                    multiEnabled || focusMode === "teams"
                                      ? member.name
                                      : active
                                        ? tSubtasks("unassignMember", {
                                            name: member.name,
                                          })
                                        : tSubtasks("assignMember", {
                                            name: member.name,
                                          })
                                  }
                                  onClick={() =>
                                    handleCollaboratorClick(member.documentId)
                                  }
                                >
                                  {showAssignWarn ? (
                                    <KanbanFloatingCountBadge
                                      count={assignedCount}
                                      ariaLabel={tKanban(
                                        "assignWarnColaboratorBadge",
                                        {
                                          name: member.name,
                                          count: assignedCount,
                                        },
                                      )}
                                    />
                                  ) : null}
                                  <CardBadge
                                    title={member.name}
                                    className={cn(
                                      "max-w-full cursor-pointer truncate transition-colors",
                                      memberDisabled &&
                                        "pointer-events-none opacity-50",
                                      active
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                                    )}
                                  >
                                    {member.name}
                                  </CardBadge>
                                </button>
                              );
                            })
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )}
      </FormModalShell>

      <FormModalShell
        open={infoSubtask !== null}
        title={tKanban("infoTitle")}
        onClose={closeInfoPanel}
        size="lg"
        layer="nested"
      >
        {infoSubtask ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate font-medium">
                  {infoSubtask.name}
                </p>
                <span
                  className="inline-flex shrink-0 items-center gap-1 tabular-nums text-muted-foreground"
                  aria-label={tKanban("subtaskPayment", {
                    count: infoPayment,
                    currency: paymentCurrency.pluralTitle || tBalance("stars"),
                  })}
                >
                  <CurrencyMediaIcon
                    url={paymentCurrency.iconUrl}
                    className="size-4"
                  />
                  <span>{infoPayment}</span>
                </span>
              </div>
              <TimeMetrics
                expectedTime={infoSubtask.expectedTime}
                timeSpent={infoSubtask.timeSpent}
              />
            </div>
            {infoSessionsLoading && loadSubtaskSession ? (
              <p className="text-sm text-muted-foreground" role="status">
                {tSubtasks("sessionsLoading")}
              </p>
            ) : (
              <SubTaskSessionsPanel
                sessions={
                  loadSubtaskSession
                    ? (infoSessions ?? [])
                    : infoSubtask.sessions
                }
                sharingType={infoSubtask.sharingType}
                expectedTime={infoSubtask.expectedTime}
                timeSpent={infoSubtask.timeSpent}
                targetQty={Math.max(1, infoSubtask.qty) * Math.max(1, taskQty)}
                paymentCurrency={paymentCurrency}
                totalsFirst
              />
            )}
          </div>
        ) : null}
      </FormModalShell>

      <ConfirmDialog
        open={exitConfirmOpen}
        title={tKanban("multiExitTitle")}
        description={tKanban("multiExitConfirm")}
        cancelLabel={tCommon("yes")}
        confirmLabel={tCommon("no")}
        confirmVariant="default"
        onClose={handleExitConfirmYes}
        onConfirm={handleExitConfirmNo}
      />
    </>
  );
}
