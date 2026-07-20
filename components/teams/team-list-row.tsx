import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { isTeamActive } from "@/lib/business/team-active";
import { formatDatePtBr } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";

import type { TeamRow } from "./types";

export interface TeamListRowProps {
  team: TeamRow;
  variant: "table" | "mobile";
  onOpen: (team: TeamRow) => void;
}

export function TeamListRow({ team, variant, onOpen }: TeamListRowProps) {
  const tTeams = useTranslations("teams");
  const active = isTeamActive(team.untill);
  const statusLabel = active ? tTeams("active") : tTeams("inactive");

  function openTeam(): void {
    onOpen(team);
  }

  const interaction = {
    tabIndex: 0 as const,
    role: "link" as const,
    "aria-label": team.name,
    onClick: openTeam,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openTeam();
      }
    },
  };

  const rowClassName = cn(
    "border-b cursor-pointer hover:bg-muted/40",
    "focus-visible:bg-muted/40 focus-visible:outline-none",
    !active && "text-muted-foreground",
  );

  if (variant === "table") {
    return (
      <tr {...interaction} className={rowClassName}>
        <td className="py-2">{team.name}</td>
        <td>{formatDatePtBr(team.since)}</td>
        <td>{formatDatePtBr(team.untill)}</td>
        <td>{statusLabel}</td>
        <td>{team.exchangesFirstDay}</td>
        <td>{team.exchangesLastDay}</td>
        <td>{team.leader?.name ?? "—"}</td>
      </tr>
    );
  }

  return (
    <li {...interaction} className={cn("list-none py-3", rowClassName)}>
      <div className="text-base font-medium">{team.name}</div>
      <div className="text-muted-foreground text-sm">
        {statusLabel} · {team.leader?.name ?? "—"}
      </div>
      <div className="text-muted-foreground text-sm">
        {formatDatePtBr(team.since)}
        {team.untill ? ` → ${formatDatePtBr(team.untill)}` : ""}
      </div>
      <div className="text-muted-foreground text-sm">
        {tTeams("exchangesFirstDay")}: {team.exchangesFirstDay} ·{" "}
        {tTeams("exchangesLastDay")}: {team.exchangesLastDay}
      </div>
    </li>
  );
}
