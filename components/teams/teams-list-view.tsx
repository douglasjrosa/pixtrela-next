"use client";

import { useTranslations } from "next-intl";

import { TeamListRow } from "./team-list-row";
import type { TeamRow } from "./types";

export interface TeamsListViewProps {
  teams: TeamRow[];
  onOpen: (team: TeamRow) => void;
}

export function TeamsListView({ teams, onOpen }: TeamsListViewProps) {
  const tTeams = useTranslations("teams");

  if (teams.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-sm">{tTeams("empty")}</p>
    );
  }

  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">{tTeams("name")}</th>
            <th>{tTeams("since")}</th>
            <th>{tTeams("untill")}</th>
            <th>{tTeams("status")}</th>
            <th>{tTeams("exchangesFirstDay")}</th>
            <th>{tTeams("exchangesLastDay")}</th>
            <th>{tTeams("leader")}</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <TeamListRow
              key={team.documentId}
              team={team}
              variant="table"
              onOpen={onOpen}
            />
          ))}
        </tbody>
      </table>

      <ul className="md:hidden">
        {teams.map((team) => (
          <TeamListRow
            key={team.documentId}
            team={team}
            variant="mobile"
            onOpen={onOpen}
          />
        ))}
      </ul>
    </>
  );
}
