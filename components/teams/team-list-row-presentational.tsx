"use client";

import type { KeyboardEvent } from "react";

import { CardBadge } from "@/components/ui/card";
import { isTeamActive } from "@/lib/business/team-active";
import { cn } from "@/lib/utils";

import { TeamListRowCheckbox } from "./team-list-row-checkbox";
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
  inactive: string;
  selectRow: string;
};

export interface TeamListRowPresentationalProps {
  team: TeamRow;
  variant: "table" | "mobile";
  labels: TeamListRowLabels;
  showCheckboxColumn?: boolean;
}

export function TeamListRowPresentational({
  team,
  variant,
  labels,
  showCheckboxColumn = false,
}: TeamListRowPresentationalProps) {
  const { openEdit } = useTeamList();
  const dateInactive = !isTeamActive(team.untill);
  const archived = !team.active;
  const muted = dateInactive || archived;
  const activate = () => openEdit(team);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  };

  const nameCell = (
    <>
      {team.name}
      {archived ? (
        <CardBadge className="ml-2">{labels.inactive}</CardBadge>
      ) : null}
    </>
  );

  const rowClassName = cn(
    "cursor-pointer border-b hover:bg-muted/40",
    muted && "text-muted-foreground",
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
        {showCheckboxColumn ? (
          <TeamListRowCheckbox
            documentId={team.documentId}
            variant="table"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <td className="py-2">{nameCell}</td>
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
      <div className="flex items-start gap-3">
        {showCheckboxColumn ? (
          <TeamListRowCheckbox
            documentId={team.documentId}
            variant="mobile"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-base font-medium">{nameCell}</div>
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
        </div>
      </div>
    </li>
  );
}
