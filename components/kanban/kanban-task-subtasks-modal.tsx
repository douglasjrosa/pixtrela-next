"use client";

import { useEffect, useRef, useState } from "react";
import { User, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { CurrencyMediaIcon } from "@/components/currency/currency-media-icon";
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
  isSubtaskAssignedTo,
  splitSubtasksByFinished,
  toggleCollaboratorOnSubtask,
  toggleTeamOnSubtask,
} from "@/lib/business/board-assign-focus";
import { getSubtaskAssigneeIds } from "@/lib/business/board-assignee-draft";
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
import {
  countSessionParticipants,
  resolveLatestSessionFinishedAt,
} from "@/lib/business/task-progress";
import { splitDateTimePtBr } from "@/lib/format/datetime";
import type { SubtaskPaymentCurrency } from "@/lib/strapi/currency-for-subtasks";
import {
  showConfirmToast,
  showHintToast,
  showSuccessToast,
} from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

import { KanbanFloatingCountBadge } from "./kanban-floating-count-badge";
import { KanbanMultiAssignToolbar } from "./kanban-multi-assign-toolbar";
import type { BoardSubTaskSummary } from "./types";

type MainTab = "pending" | "finished";
type FocusMode = "subtasks" | "teams";
type PendingExitAction = "disable-multi" | "go-finished";

const EMPTY_PAYMENT_CURRENCY: SubtaskPaymentCurrency = {
  iconUrl: null,
  currencyPerSecond: 0,
  pluralTitle: "",
};

export interface KanbanTaskSubtasksModalProps {
  open: boolean;
  taskName: string;
  subtasks: BoardSubTaskSummary[];
  teams: TeamAssignmentOption[];
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
  paymentCurrency?: SubtaskPaymentCurrency;
  loading: boolean;
  dirty: boolean;
  saving: boolean;
  onClose: () => void;
  onAssigneesChange: (
    subtask: BoardSubTaskSummary,
    assignedToIds: string[],
  ) => void;
  onSave: () => void;
  onAddSubtask?: () => void;
}

function getTeamMemberIds(team: TeamAssignmentOption): string[] {
  return team.members.map((member) => member.documentId);
}

function areAllSelected(ids: string[], value: string[]): boolean {
  return ids.length > 0 && ids.every((id) => value.includes(id));
}

function SubTaskCardHeader({
  name,
  status,
  statusLabel,
  workingCount,
}: {
  name: string;
  status: BoardSubTaskSummary["status"];
  statusLabel: string;
  workingCount: number;
}) {
  const tKanban = useTranslations("kanban");
  const isProducing = status === PRODUCING_STATUS;
  const showActive = isProducing && workingCount > 0;

  return (
    <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-2">
      <span className="w-full font-medium md:min-w-0 md:flex-1">{name}</span>
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

export function KanbanTaskSubtasksModal({
  open,
  taskName,
  subtasks,
  teams,
  assignWarnMax,
  assignedCountByColaboratorId,
  paymentCurrency = EMPTY_PAYMENT_CURRENCY,
  loading,
  dirty,
  saving,
  onClose,
  onAssigneesChange,
  onSave,
  onAddSubtask,
}: KanbanTaskSubtasksModalProps) {
  const tCommon = useTranslations("common");
  const tKanban = useTranslations("kanban");
  const tStatus = useTranslations("tasks.status");
  const tSubtasks = useTranslations("subtasks");
  const tBalance = useTranslations("balance");

  const [mainTab, setMainTab] = useState<MainTab>("pending");
  const [focusMode, setFocusMode] = useState<FocusMode>("subtasks");
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(
    null,
  );
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
  const userSelectedFinishedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      userSelectedFinishedRef.current = false;
      return;
    }
    setFocusMode("subtasks");
    setSelectedSubtaskId(null);
    setSelectedCollaboratorId(null);
    setMultiEnabled(false);
    setSelectedSubtaskIds([]);
    setSelectedCollaboratorIds([]);
    setExitConfirmOpen(false);
    setPendingExitAction(null);
    setInfoSubtask(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const split = splitSubtasksByFinished(subtasks);
    if (split.pending.length === 0 && split.finished.length > 0) {
      setMainTab("finished");
      return;
    }
    if (split.finished.length === 0) {
      userSelectedFinishedRef.current = false;
      setMainTab("pending");
      return;
    }
    if (!userSelectedFinishedRef.current) {
      setMainTab("pending");
    }
  }, [open, subtasks]);

  if (!open) return null;

  const { pending, finished } = splitSubtasksByFinished(subtasks);
  const hasPendingSubtasks = pending.length > 0;
  const hasFinishedSubtasks = finished.length > 0;
  const activeMainTab: MainTab = !hasFinishedSubtasks
    ? "pending"
    : !hasPendingSubtasks
      ? "finished"
      : mainTab;
  const selectedSubtask =
    pending.find((item) => item.documentId === selectedSubtaskId) ?? null;
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
      userSelectedFinishedRef.current = true;
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
    if (!enabled) {
      requestExitMulti("disable-multi");
      return;
    }
    confirmIfDirty(() => {
      setMultiEnabled(true);
      setSelectedSubtaskIds([]);
      setSelectedCollaboratorIds([]);
      setSelectedSubtaskId(null);
      setSelectedCollaboratorId(null);
    });
  }

  function handleMainTabChange(next: MainTab): void {
    if (next !== "finished") {
      userSelectedFinishedRef.current = false;
      setMainTab(next);
      return;
    }
    if (dirty) {
      confirmIfDirty(() => {
        userSelectedFinishedRef.current = true;
        if (multiEnabled) {
          applyExitAction("go-finished");
          return;
        }
        setMainTab("finished");
      });
      return;
    }
    if (multiEnabled) {
      requestExitMulti("go-finished");
      return;
    }
    userSelectedFinishedRef.current = true;
    setMainTab("finished");
  }

  function handleAddSubtask(): void {
    if (!onAddSubtask) return;
    confirmIfDirty(onAddSubtask);
  }

  function handleFocusModeChange(next: FocusMode): void {
    if (multiEnabled) return;
    setFocusMode(next);
    setSelectedSubtaskId(null);
    setSelectedCollaboratorId(null);
  }

  function requestClose(): void {
    confirmIfDirty(onClose);
  }

  function handlePendingSubtaskClick(subtask: BoardSubTaskSummary): void {
    if (multiEnabled) {
      setSelectedSubtaskIds((current) =>
        toggleIdInSet(current, subtask.documentId),
      );
      return;
    }

    if (focusMode === "subtasks") {
      setSelectedSubtaskId((current) =>
        current === subtask.documentId ? null : subtask.documentId,
      );
      return;
    }

    if (!selectedCollaboratorId) {
      showHintToast(tKanban("chooseCollaboratorFirst"));
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
    const nextIds = toggleCollaboratorOnSubtask(
      getSubtaskAssigneeIds(selectedSubtask),
      collaboratorId,
    );
    onAssigneesChange(selectedSubtask, nextIds);
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
    const nextIds = toggleTeamOnSubtask(
      getSubtaskAssigneeIds(selectedSubtask),
      teamIds,
    );
    onAssigneesChange(selectedSubtask, nextIds);
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
        footerEnd={
          <>
            {onAddSubtask ? (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={handleAddSubtask}
              >
                {tKanban("addSubtask")}
              </Button>
            ) : null}
            <Button type="button" disabled={!dirty || saving} onClick={onSave}>
              {tCommon("save")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{taskName}</p>

        {hasPendingSubtasks || hasFinishedSubtasks ? (
          <div
            role="tablist"
            aria-label={tKanban("subtasksTitle")}
            className="flex gap-4 border-b"
          >
            {hasPendingSubtasks ? (
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
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground" role="status">
            {tKanban("loading")}
          </p>
        ) : subtasks.length === 0 ? (
          <p className="text-sm text-muted-foreground" role="status">
            {tKanban("subtasksEmpty")}
          </p>
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
                      onClick={() => setInfoSubtask(subtask)}
                    >
                      <SubTaskUnassignedFloatingBadge
                        assignedCount={subtask.assignedTo.length}
                      />
                      <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0 flex-1 font-medium">
                          {subtask.name}
                        </span>
                        <span
                          className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground"
                          aria-label={tKanban("finishedParticipants", {
                            count: participantCount,
                          })}
                        >
                          <Users className="size-3.5 shrink-0" aria-hidden />
                          <span>{participantCount}</span>
                        </span>
                      </div>
                      <div className="mt-1 space-y-1">
                        <TimeMetrics
                          expectedTime={subtask.expectedTime}
                          timeSpent={subtask.timeSpent}
                        />
                        {finishedAt && finishedParts ? (
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
          </ul>
        ) : (
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col gap-4",
              FORM_MODAL_PRIMARY_PANEL_MIN_HEIGHT_CLASS,
            )}
          >
            <KanbanMultiAssignToolbar
              multiEnabled={multiEnabled}
              canApply={canApply}
              disabled={saving}
              onMultiEnabledChange={handleMultiEnabledChange}
              onAssign={handleMultiAssign}
              onRemove={handleMultiRemove}
            />

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
                <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pt-2 pr-2.5">
                  {pending.length === 0 ? (
                    <li className="text-sm text-muted-foreground" role="status">
                      {tKanban("subtasksEmpty")}
                    </li>
                  ) : (
                    pending.map((subtask) => {
                      const highlighted = isPendingSubtaskHighlighted(subtask);
                      return (
                        <li key={subtask.documentId}>
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
                            onClick={() => handlePendingSubtaskClick(subtask)}
                          >
                            <SubTaskUnassignedFloatingBadge
                              assignedCount={subtask.assignedTo.length}
                            />
                            <SubTaskCardHeader
                              name={subtask.name}
                              status={subtask.status}
                              statusLabel={tStatus(subtask.status)}
                              workingCount={
                                subtask.openActivityStartedAts.length
                              }
                            />
                            <SubTaskProgressBar
                              status={subtask.status}
                              expectedTime={subtask.expectedTime}
                              timeSpent={subtask.timeSpent}
                              openActivityStartedAts={
                                subtask.openActivityStartedAts
                              }
                            />
                          </button>
                        </li>
                      );
                    })
                  )}
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
                              const memberDisabled = saving;
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
        onClose={() => setInfoSubtask(null)}
        size="lg"
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
            <SubTaskSessionsPanel
              sessions={infoSubtask.sessions}
              sharingType={infoSubtask.sharingType}
              expectedTime={infoSubtask.expectedTime}
              timeSpent={infoSubtask.timeSpent}
              paymentCurrency={paymentCurrency}
              totalsFirst
            />
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
