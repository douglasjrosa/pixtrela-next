"use client";

import type { KeyboardEvent } from "react";

import { isTeamActive } from "@/lib/business/team-active";
import { cn } from "@/lib/utils";

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
  const activate = () => openEdit(team);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  };

  const rowClassName = cn(
    "cursor-pointer border-b hover:bg-muted/40",
    !active && "text-muted-foreground",
  );
  const rowProps = {
    onClick: activate,
    onKeyDown,
    role: "button" as const,
    tabIndex: 0,
    "aria-label": team.name,
  };

  if (variant === "table") {
    return (
      <tr className={rowClassName} {...rowProps}>
        <td className="py-2">{team.name}</td>
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
    <li className={cn("list-none py-3", rowClassName)} {...rowProps}>
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
