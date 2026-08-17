"use client";

import { useTranslations } from "next-intl";

import { KanbanFloatingCountBadge } from "@/components/kanban/kanban-floating-count-badge";
import { KanbanMultiAssignToolbar } from "@/components/kanban/kanban-multi-assign-toolbar";
import { TaskProgressBarSkeleton } from "@/components/kanban/task-progress-bar-skeleton";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { Card, CardBadge, CardContent } from "@/components/ui/card";
import { FORM_MODAL_PRIMARY_PANEL_MIN_HEIGHT_CLASS } from "@/components/ui/form-modal-shell";
import { shouldShowAssignWarn } from "@/lib/business/assign-warn";
import { cn } from "@/lib/utils";

export const SUBTASK_LOADING_SKELETON_COUNT = 4;
const TEAM_LOADING_SKELETON_COUNT = 3;
const TEAM_MEMBER_SKELETON_COUNT = 4;
const ASSIGNEE_BADGE_SKELETON_COUNT = 3;

function PulseBlock({ className }: { className: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} />;
}

function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

export function KanbanPendingSubtaskCardSkeleton() {
  return (
    <li className="overflow-visible">
      <div className="flex items-stretch gap-1">
        <div
          className="flex w-6 shrink-0 items-center justify-center"
          aria-hidden
        >
          <PulseBlock className="h-4 w-3" />
        </div>
        <div className="min-w-0 flex-1 rounded-lg border p-3">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <PulseBlock className="h-4 w-1/3" />
              <div className="flex flex-wrap items-center gap-1">
                <PulseBlock className="h-8 w-8" />
                {range(ASSIGNEE_BADGE_SKELETON_COUNT).map((index) => (
                  <PulseBlock
                    key={index}
                    className="h-5 w-14 rounded-md"
                  />
                ))}
              </div>
            </div>
            <PulseBlock className="h-5 w-20 shrink-0 rounded-md" />
          </div>
          <TaskProgressBarSkeleton />
        </div>
      </div>
    </li>
  );
}

function KanbanTeamCardSkeleton({ index }: { index: number }) {
  return (
    <Card className="min-w-0 shadow-sm" data-testid="kanban-team-skeleton">
      <div className="px-3 pt-3">
        <PulseBlock className={index === 0 ? "h-3 w-16" : "h-3 w-20"} />
      </div>
      <CardContent className="flex min-w-0 flex-wrap gap-2 px-3 pb-3 pt-2">
        {range(TEAM_MEMBER_SKELETON_COUNT).map((memberIndex) => (
          <PulseBlock
            key={memberIndex}
            className="h-6 w-16 rounded-md"
          />
        ))}
      </CardContent>
    </Card>
  );
}

function KanbanLoadingTeamsColumn({
  teams,
  assignWarnMax,
  assignedCountByColaboratorId,
}: {
  teams: readonly TeamAssignmentOption[];
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
}) {
  const tKanban = useTranslations("kanban");
  const tSubtasks = useTranslations("subtasks");

  if (teams.length === 0) {
    return (
      <>
        {range(TEAM_LOADING_SKELETON_COUNT).map((index) => (
          <KanbanTeamCardSkeleton key={index} index={index} />
        ))}
      </>
    );
  }

  return (
    <>
      {teams.map((team) => (
        <Card key={team.documentId} className="min-w-0 shadow-sm">
          <p className="px-3 pt-3 text-xs font-medium text-muted-foreground">
            {team.name}
          </p>
          <CardContent className="flex min-w-0 flex-wrap gap-2 px-3 pb-3 pt-2">
            {team.members.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                {tSubtasks("noTeamMembers")}
              </span>
            ) : (
              team.members.map((member) => {
                const assignedCount =
                  assignedCountByColaboratorId[member.documentId] ?? 0;
                const showAssignWarn = shouldShowAssignWarn(
                  assignedCount,
                  assignWarnMax,
                );
                return (
                  <span
                    key={member.documentId}
                    className="relative max-w-full min-w-0"
                  >
                    {showAssignWarn ? (
                      <KanbanFloatingCountBadge
                        count={assignedCount}
                        ariaLabel={tKanban("assignWarnColaboratorBadge", {
                          name: member.name,
                          count: assignedCount,
                        })}
                      />
                    ) : null}
                    <CardBadge
                      title={member.name}
                      className={
                        "max-w-full truncate bg-muted text-muted-foreground"
                      }
                    >
                      {member.name}
                    </CardBadge>
                  </span>
                );
              })
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export interface KanbanTaskSubtasksLoadingBodyProps {
  teams: readonly TeamAssignmentOption[];
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
}

export function KanbanTaskSubtasksLoadingBody({
  teams,
  assignWarnMax,
  assignedCountByColaboratorId,
}: KanbanTaskSubtasksLoadingBodyProps) {
  const tKanban = useTranslations("kanban");

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col gap-4",
        FORM_MODAL_PRIMARY_PANEL_MIN_HEIGHT_CLASS,
      )}
      role="status"
      aria-busy="true"
      aria-label={tKanban("loading")}
      data-testid="kanban-subtasks-loading"
    >
      <KanbanMultiAssignToolbar
        multiEnabled={false}
        canApply={false}
        disabled
        onMultiEnabledChange={() => undefined}
        onAssign={() => undefined}
        onRemove={() => undefined}
      />

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[7fr_3fr] gap-4">
        <section className="flex min-h-0 min-w-0 flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">
            {tKanban("subtasksColumn")}
          </p>
          <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pt-2 pr-2.5">
            {range(SUBTASK_LOADING_SKELETON_COUNT).map((index) => (
              <KanbanPendingSubtaskCardSkeleton key={index} />
            ))}
          </ul>
        </section>

        <section className="flex min-h-0 min-w-0 flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">
            {tKanban("teamsColumn")}
          </p>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto pr-2.5">
            <KanbanLoadingTeamsColumn
              teams={teams}
              assignWarnMax={assignWarnMax}
              assignedCountByColaboratorId={assignedCountByColaboratorId}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
