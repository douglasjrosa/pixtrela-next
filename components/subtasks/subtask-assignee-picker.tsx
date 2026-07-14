"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardBadge, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { TeamAssignmentOption } from "./subtask-manager";

export type SubTaskAssigneePickerVariant = "cards" | "rows";

export interface SubTaskAssigneePickerProps {
  id: string;
  label?: string;
  teams: TeamAssignmentOption[];
  value: string[];
  onChange: (next: string[]) => void;
  variant?: SubTaskAssigneePickerVariant;
  disabled?: boolean;
}

type TeamMember = TeamAssignmentOption["members"][number];

function getAllMemberIds(teams: TeamAssignmentOption[]): string[] {
  return teams.flatMap((team) => team.members.map((member) => member.documentId));
}

function getTeamMemberIds(team: TeamAssignmentOption): string[] {
  return team.members.map((member) => member.documentId);
}

function areAllSelected(ids: string[], value: string[]): boolean {
  return ids.length > 0 && ids.every((id) => value.includes(id));
}

function toggleIdInList(value: string[], documentId: string): string[] {
  if (value.includes(documentId)) {
    return value.filter((memberId) => memberId !== documentId);
  }
  return [...value, documentId];
}

function toggleTeamInList(value: string[], team: TeamAssignmentOption): string[] {
  const teamIds = getTeamMemberIds(team);
  if (teamIds.length === 0) return value;

  if (areAllSelected(teamIds, value)) {
    return value.filter((memberId) => !teamIds.includes(memberId));
  }

  return [...new Set([...value, ...teamIds])];
}

export function SubTaskAssigneePicker({
  id,
  label,
  teams,
  value,
  onChange,
  variant = "cards",
  disabled = false,
}: SubTaskAssigneePickerProps) {
  const tSubtasks = useTranslations("subtasks");
  const allMemberIds = getAllMemberIds(teams);
  const allSelected = areAllSelected(allMemberIds, value);
  const isRows = variant === "rows";

  function renderMemberButton(member: TeamMember) {
    const isAssigned = value.includes(member.documentId);
    return (
      <button
        key={member.documentId}
        type="button"
        disabled={disabled}
        aria-pressed={isAssigned}
        aria-label={
          isAssigned
            ? tSubtasks("unassignMember", { name: member.name })
            : tSubtasks("assignMember", { name: member.name })
        }
        onClick={() => onChange(toggleIdInList(value, member.documentId))}
      >
        <CardBadge
          className={cn(
            "cursor-pointer transition-colors",
            disabled && "pointer-events-none opacity-50",
            isAssigned
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {member.name}
        </CardBadge>
      </button>
    );
  }

  function renderMembers(team: TeamAssignmentOption) {
    if (team.members.length === 0) {
      return (
        <span className="text-xs text-muted-foreground">
          {tSubtasks("noTeamMembers")}
        </span>
      );
    }
    return team.members.map((member) => renderMemberButton(member));
  }

  function renderTeamToggle(
    team: TeamAssignmentOption,
    className: string,
  ) {
    const teamIds = getTeamMemberIds(team);
    return (
      <button
        type="button"
        className={className}
        disabled={disabled || teamIds.length === 0}
        aria-pressed={areAllSelected(teamIds, value)}
        aria-label={tSubtasks("toggleTeamMembers", { team: team.name })}
        onClick={() => onChange(toggleTeamInList(value, team))}
      >
        {team.name}
      </button>
    );
  }

  return (
    <div className={cn(isRows ? "space-y-2" : "space-y-3")}>
      {isRows ? (
        label ? (
          <Label id={id} className="sr-only">
            {label}
          </Label>
        ) : null
      ) : (
        <div className="flex items-center justify-between gap-2">
          {label ? <Label id={id}>{label}</Label> : <span id={id} className="sr-only" />}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || allMemberIds.length === 0}
            aria-pressed={allSelected}
            aria-label={tSubtasks("selectAllMembers")}
            onClick={() => onChange(allSelected ? [] : allMemberIds)}
          >
            {tSubtasks("selectAll")}
          </Button>
        </div>
      )}

      <div
        role="group"
        aria-labelledby={label || !isRows ? id : undefined}
        className={cn(isRows ? "space-y-2" : "grid gap-3 sm:grid-cols-2")}
      >
        {teams.map((team) => {
          const teamIds = getTeamMemberIds(team);

          if (isRows) {
            return (
              <div
                key={team.documentId}
                className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2"
              >
                {renderTeamToggle(
                  team,
                  cn(
                    "shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-semibold",
                    "uppercase tracking-wide text-secondary-foreground",
                    teamIds.length === 0 && "cursor-default opacity-60",
                  ),
                )}
                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  {renderMembers(team)}
                </div>
              </div>
            );
          }

          return (
            <Card key={team.documentId} className="shadow-sm">
              {renderTeamToggle(
                team,
                cn(
                  "w-full px-3 pt-3 text-left text-xs font-medium",
                  teamIds.length > 0
                    ? "text-muted-foreground hover:text-foreground"
                    : "cursor-default text-muted-foreground",
                ),
              )}
              <CardContent className="flex flex-wrap gap-2 px-3 pb-3 pt-2">
                {renderMembers(team)}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
