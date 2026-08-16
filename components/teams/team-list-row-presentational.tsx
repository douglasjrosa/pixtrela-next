"use client";

import { isTeamActive } from "@/lib/business/team-active";
import { cn } from "@/lib/utils";
import { useListRowActivateInteraction } from "@/lib/ui/list-row-interaction";

import { useTeamList } from "./team-list-context";
import type { TeamRow } from "./types";

const CENTER_CELL_CLASS = "text-center";

export type TeamListRowLabels = {
  since: string;
  untill: string;
  status: string;
  leader: string;
  exchangesFirstDay: string;
  exchangesLastDay: string;
};

export interface TeamListRowPresentationalProps {
  team: TeamRow;
  variant: "table" | "mobile";
  labels: TeamListRowLabels;
}

export function TeamListRowPresentational({
  team,
  variant,
  labels,
}: TeamListRowPresentationalProps) {
  const { openEdit } = useTeamList();
  const active = isTeamActive(team.untill);
  const { interactive, activate, ...a11yProps } = useListRowActivateInteraction(
    team.name,
    () => openEdit(team),
  );

  const rowClassName = cn(
    "border-b",
    interactive && "cursor-pointer hover:bg-muted/40",
    !active && "text-muted-foreground",
  );

  if (variant === "table") {
    return (
      <tr className={rowClassName} onClick={activate} {...a11yProps}>
        <td className="py-2">
          <span>{team.name}</span>
        </td>
        <td className={CENTER_CELL_CLASS}>{labels.since}</td>
        <td className={CENTER_CELL_CLASS}>{labels.untill}</td>
        <td className={CENTER_CELL_CLASS}>{labels.status}</td>
        <td className={CENTER_CELL_CLASS}>{team.exchangesFirstDay}</td>
        <td className={CENTER_CELL_CLASS}>{team.exchangesLastDay}</td>
        <td className={CENTER_CELL_CLASS}>{labels.leader}</td>
      </tr>
    );
  }

  return (
    <li className={cn("list-none py-3", rowClassName)} onClick={activate} {...a11yProps}>
      <div className="text-base font-medium">{team.name}</div>
      <div className="text-muted-foreground text-sm">
        {labels.status} · {labels.leader}
      </div>
      <div className="text-muted-foreground text-sm">
        {labels.since}
        {team.untill ? ` → ${labels.untill}` : ""}
      </div>
      <div className="text-muted-foreground text-sm">
        {labels.exchangesFirstDay}: {team.exchangesFirstDay} ·{" "}
        {labels.exchangesLastDay}: {team.exchangesLastDay}
      </div>
    </li>
  );
}
