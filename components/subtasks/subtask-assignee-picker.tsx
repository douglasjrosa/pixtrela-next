"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardBadge, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { TeamAssignmentOption } from "./subtask-manager";

export interface SubTaskAssigneePickerProps {
  id: string;
  label: string;
  teams: TeamAssignmentOption[];
  value: string[];
  onChange: (next: string[]) => void;
}

function getAllMemberIds(teams: TeamAssignmentOption[]): string[] {
  return teams.flatMap((team) => team.members.map((member) => member.documentId));
}

export function SubTaskAssigneePicker({
  id,
  label,
  teams,
  value,
  onChange,
}: SubTaskAssigneePickerProps) {
  const tSubtasks = useTranslations("subtasks");
  const allMemberIds = getAllMemberIds(teams);
  const allSelected =
    allMemberIds.length > 0 && allMemberIds.every((memberId) => value.includes(memberId));

  function toggleMember(documentId: string): void {
    if (value.includes(documentId)) {
      onChange(value.filter((memberId) => memberId !== documentId));
      return;
    }
    onChange([...value, documentId]);
  }

  function toggleAllMembers(): void {
    onChange(allSelected ? [] : allMemberIds);
  }

  function toggleTeamMembers(team: TeamAssignmentOption): void {
    const teamIds = team.members.map((member) => member.documentId);
    if (teamIds.length === 0) return;

    const allTeamSelected = teamIds.every((memberId) => value.includes(memberId));
    if (allTeamSelected) {
      onChange(value.filter((memberId) => !teamIds.includes(memberId)));
      return;
    }

    const next = new Set(value);
    for (const memberId of teamIds) {
      next.add(memberId);
    }
    onChange([...next]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label id={id}>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={allMemberIds.length === 0}
          aria-pressed={allSelected}
          aria-label={tSubtasks("selectAllMembers")}
          onClick={toggleAllMembers}
        >
          {tSubtasks("selectAll")}
        </Button>
      </div>
      <div
        role="group"
        aria-labelledby={id}
        className="grid gap-3 sm:grid-cols-2"
      >
        {teams.map((team) => {
          const teamIds = team.members.map((member) => member.documentId);
          const allTeamSelected =
            teamIds.length > 0 && teamIds.every((memberId) => value.includes(memberId));

          return (
            <Card key={team.documentId} className="shadow-sm">
              <button
                type="button"
                className={cn(
                  "w-full px-3 pt-3 text-left text-xs font-medium",
                  teamIds.length > 0
                    ? "text-muted-foreground hover:text-foreground"
                    : "cursor-default text-muted-foreground",
                )}
                disabled={teamIds.length === 0}
                aria-pressed={allTeamSelected}
                aria-label={tSubtasks("toggleTeamMembers", { team: team.name })}
                onClick={() => toggleTeamMembers(team)}
              >
                {team.name}
              </button>
              <CardContent className="flex flex-wrap gap-2 px-3 pb-3 pt-2">
                {team.members.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {tSubtasks("noTeamMembers")}
                  </span>
                ) : (
                  team.members.map((member) => {
                    const isAssigned = value.includes(member.documentId);
                    return (
                      <button
                        key={member.documentId}
                        type="button"
                        aria-pressed={isAssigned}
                        aria-label={
                          isAssigned
                            ? tSubtasks("unassignMember", { name: member.name })
                            : tSubtasks("assignMember", { name: member.name })
                        }
                        onClick={() => toggleMember(member.documentId)}
                      >
                        <CardBadge
                          className={cn(
                            "cursor-pointer transition-colors",
                            isAssigned
                              ? "border-primary bg-primary text-primary-foreground"
                              : "bg-muted/40 text-muted-foreground hover:bg-muted",
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
    </div>
  );
}
