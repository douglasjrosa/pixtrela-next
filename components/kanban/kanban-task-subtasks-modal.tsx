"use client";

import { useEffect, useState } from "react";
import { User, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { SubTaskProgressBar } from "@/components/kanban/subtask-progress-bar";
import { SubTaskSessionsPanel } from "@/components/subtasks/subtask-sessions-panel";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { Button } from "@/components/ui/button";
import { Card, CardBadge, CardContent } from "@/components/ui/card";
import {
  isSubtaskAssignedTo,
  splitSubtasksByFinished,
  toggleCollaboratorOnSubtask,
  toggleTeamOnSubtask,
} from "@/lib/business/board-assign-focus";
import { getSubtaskAssigneeIds } from "@/lib/business/board-assignee-draft";
import { shouldShowAssignWarn } from "@/lib/business/assign-warn";
import {
  KANBAN_PRODUCING_BADGE_CLASS_NAME,
  PRODUCING_STATUS,
} from "@/lib/business/kanban-status-badge";
import { cn } from "@/lib/utils";

import { KanbanFloatingCountBadge } from "./kanban-floating-count-badge";
import type { BoardSubTaskSummary } from "./types";

const FINISHED_STATUS = "finished";

type MainTab = "pending" | "finished";
type FocusMode = "subtasks" | "teams";

export interface KanbanTaskSubtasksModalProps {
  open: boolean;
  taskName: string;
  subtasks: BoardSubTaskSummary[];
  teams: TeamAssignmentOption[];
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
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

  const [mainTab, setMainTab] = useState<MainTab>("pending");
  const [focusMode, setFocusMode] = useState<FocusMode>("subtasks");
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(
    null,
  );
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!open) return;
    setMainTab("pending");
    setFocusMode("subtasks");
    setSelectedSubtaskId(null);
    setSelectedCollaboratorId(null);
  }, [open]);

  if (!open) return null;

  const { pending, finished } = splitSubtasksByFinished(subtasks);
  const selectedSubtask =
    pending.find((item) => item.documentId === selectedSubtaskId) ?? null;
  const selectedAssigneeIds = selectedSubtask
    ? getSubtaskAssigneeIds(selectedSubtask)
    : [];

  function handleFocusModeChange(next: FocusMode): void {
    setFocusMode(next);
    setSelectedSubtaskId(null);
    setSelectedCollaboratorId(null);
  }

  function handlePendingSubtaskClick(subtask: BoardSubTaskSummary): void {
    if (focusMode === "subtasks") {
      setSelectedSubtaskId((current) =>
        current === subtask.documentId ? null : subtask.documentId,
      );
      return;
    }

    if (!selectedCollaboratorId) return;
    const nextIds = toggleCollaboratorOnSubtask(
      getSubtaskAssigneeIds(subtask),
      selectedCollaboratorId,
    );
    onAssigneesChange(subtask, nextIds);
  }

  function handleCollaboratorClick(collaboratorId: string): void {
    if (focusMode === "teams") {
      setSelectedCollaboratorId((current) =>
        current === collaboratorId ? null : collaboratorId,
      );
      return;
    }

    if (!selectedSubtask) return;
    const nextIds = toggleCollaboratorOnSubtask(
      getSubtaskAssigneeIds(selectedSubtask),
      collaboratorId,
    );
    onAssigneesChange(selectedSubtask, nextIds);
  }

  function handleTeamClick(team: TeamAssignmentOption): void {
    if (focusMode === "teams") return;
    if (!selectedSubtask) return;
    const nextIds = toggleTeamOnSubtask(
      getSubtaskAssigneeIds(selectedSubtask),
      getTeamMemberIds(team),
    );
    onAssigneesChange(selectedSubtask, nextIds);
  }

  function isPendingSubtaskHighlighted(subtask: BoardSubTaskSummary): boolean {
    if (focusMode === "subtasks") {
      return subtask.documentId === selectedSubtaskId;
    }
    if (!selectedCollaboratorId) return false;
    return isSubtaskAssignedTo(subtask, selectedCollaboratorId);
  }

  function isCollaboratorActive(collaboratorId: string): boolean {
    if (focusMode === "teams") {
      return collaboratorId === selectedCollaboratorId;
    }
    return selectedAssigneeIds.includes(collaboratorId);
  }

  const teamsDisabled =
    focusMode === "subtasks" && selectedSubtaskId === null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-subtasks-title"
        className={cn(
          "relative flex h-dvh w-full max-w-none flex-col border-0",
          "rounded-none bg-background p-4 shadow-none sm:h-auto sm:max-h-[90vh]",
          "sm:max-w-4xl sm:rounded-lg sm:border sm:p-6 sm:shadow-lg",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          aria-label={tCommon("close")}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </Button>

        <div className="flex min-h-0 flex-1 flex-col space-y-4">
          <div className="space-y-1 pr-8">
            <h2
              id="kanban-subtasks-title"
              className="text-lg font-semibold"
            >
              {tKanban("subtasksTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">{taskName}</p>
          </div>

          <div
            role="tablist"
            aria-label={tKanban("subtasksTitle")}
            className="flex gap-4 border-b"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "pending"}
              className={cn(
                "border-b-2 px-1 pb-2 text-sm font-medium transition-colors",
                mainTab === "pending"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setMainTab("pending")}
            >
              {tKanban("pendingTab")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "finished"}
              className={cn(
                "border-b-2 px-1 pb-2 text-sm font-medium transition-colors",
                mainTab === "finished"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setMainTab("finished")}
            >
              {tKanban("finishedTab")}
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground" role="status">
              {tKanban("loading")}
            </p>
          ) : subtasks.length === 0 ? (
            <p className="text-sm text-muted-foreground" role="status">
              {tKanban("subtasksEmpty")}
            </p>
          ) : mainTab === "finished" ? (
            <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2.5">
              {finished.length === 0 ? (
                <li className="text-sm text-muted-foreground" role="status">
                  {tKanban("subtasksEmpty")}
                </li>
              ) : (
                finished.map((subtask) => (
                  <li
                    key={subtask.documentId}
                    className="relative rounded-lg border bg-background p-3"
                  >
                    <SubTaskUnassignedFloatingBadge
                      assignedCount={subtask.assignedTo.length}
                    />
                    <SubTaskCardHeader
                      name={subtask.name}
                      status={subtask.status}
                      statusLabel={tStatus(subtask.status)}
                      workingCount={subtask.openActivityStartedAts.length}
                    />
                    <div className="mb-3">
                      <SubTaskProgressBar
                        status={subtask.status}
                        expectedTime={subtask.expectedTime}
                        timeSpent={subtask.timeSpent}
                        openActivityStartedAts={subtask.openActivityStartedAts}
                        usePersistedRemaining
                      />
                    </div>
                    <SubTaskSessionsPanel
                      sessions={subtask.sessions}
                      sharingType={subtask.sharingType}
                    />
                  </li>
                ))
              )}
            </ul>
          ) : (
            <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[7fr_3fr] gap-4">
              <section className="flex min-h-0 min-w-0 flex-col gap-2">
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
                <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2.5">
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
                              usePersistedRemaining={
                                subtask.status === FINISHED_STATUS
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
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto pr-2.5">
                  {teams.map((team) => {
                    const teamIds = getTeamMemberIds(team);
                    const teamAllSelected =
                      focusMode === "subtasks" &&
                      areAllSelected(teamIds, selectedAssigneeIds);

                    return (
                      <Card key={team.documentId} className="min-w-0 shadow-sm">
                        {focusMode === "subtasks" ? (
                          <button
                            type="button"
                            className={cn(
                              "w-full px-3 pt-3 text-left text-xs font-medium",
                              teamsDisabled || teamIds.length === 0
                                ? "cursor-default text-muted-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            disabled={
                              saving ||
                              teamsDisabled ||
                              teamIds.length === 0
                            }
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
                              return (
                                <button
                                  key={member.documentId}
                                  type="button"
                                  className="relative max-w-full min-w-0"
                                  disabled={
                                    saving ||
                                    (focusMode === "subtasks" && teamsDisabled)
                                  }
                                  aria-pressed={active}
                                  aria-label={
                                    focusMode === "teams"
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
                                      (saving ||
                                        (focusMode === "subtasks" &&
                                          teamsDisabled)) &&
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
          )}

          <div className="flex shrink-0 justify-end gap-2">
            {onAddSubtask ? (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={onAddSubtask}
              >
                {tKanban("addSubtask")}
              </Button>
            ) : null}
            <Button type="button" disabled={!dirty || saving} onClick={onSave}>
              {tCommon("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
