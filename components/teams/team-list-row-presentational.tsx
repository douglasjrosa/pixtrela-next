"use client";

import type { KeyboardEvent } from "react";

import { CardBadge } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { TeamListRowCheckbox } from "./team-list-row-checkbox";
import { useTeamList } from "./team-list-context";
import { TeamExchangePeriodLabel } from "./team-exchange-period-label";
import type { TeamRow } from "./types";

const CELL_CLASS = "align-middle px-2 py-2";
const CENTER_CELL_CLASS = cn(CELL_CLASS, "text-center");

export type TeamListRowLabels = {
  since: string;
  untill: string;
  leader: string;
  inactive: string;
  selectRow: string;
};

export interface TeamListRowPresentationalProps {
  team: TeamRow;
  variant: "table" | "mobile";
  labels: TeamListRowLabels;
  showCheckboxColumn?: boolean;
  showUntillColumn?: boolean;
}

export function TeamListRowPresentational({
  team,
  variant,
  labels,
  showCheckboxColumn = false,
  showUntillColumn = false,
}: TeamListRowPresentationalProps) {
  const { openEdit } = useTeamList();
  const archived = !team.active;
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

  const membersCell = (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {(team.colaborators ?? []).map((colaborator) => (
        <CardBadge key={colaborator.documentId}>{colaborator.name}</CardBadge>
      ))}
    </div>
  );

  const rowClassName = cn(
    "cursor-pointer border-b hover:bg-muted/40",
    archived && "text-muted-foreground",
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
        <td className={CELL_CLASS}>{nameCell}</td>
        <td className={CENTER_CELL_CLASS}>{labels.since}</td>
        {showUntillColumn ? (
          <td className={CENTER_CELL_CLASS}>{labels.untill}</td>
        ) : null}
        <td className={CENTER_CELL_CLASS}>
          <TeamExchangePeriodLabel
            firstDay={team.exchangesFirstDay}
            lastDay={team.exchangesLastDay}
          />
        </td>
        <td className={CENTER_CELL_CLASS}>{labels.leader}</td>
        <td className={CENTER_CELL_CLASS}>{membersCell}</td>
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
          <div className="text-muted-foreground text-sm">{labels.leader}</div>
          <div className="text-muted-foreground text-sm">
            {labels.since}
            {showUntillColumn && team.untill ? ` → ${labels.untill}` : ""}
          </div>
          <div className="text-sm">
            <TeamExchangePeriodLabel
              firstDay={team.exchangesFirstDay}
              lastDay={team.exchangesLastDay}
            />
          </div>
          {(team.colaborators?.length ?? 0) > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">{membersCell}</div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
