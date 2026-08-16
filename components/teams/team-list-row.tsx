import { getTranslations } from "next-intl/server";

import { isTeamActive } from "@/lib/business/team-active";
import { formatDatePtBr } from "@/lib/format/datetime";

import {
  TeamListRowPresentational,
  type TeamListRowLabels,
} from "./team-list-row-presentational";
import type { TeamRow } from "./types";

export interface TeamListRowProps {
  team: TeamRow;
  variant: "table" | "mobile";
}

export async function TeamListRowView({ team, variant }: TeamListRowProps) {
  const tTeams = await getTranslations("teams");
  const active = isTeamActive(team.untill);
  const labels: TeamListRowLabels = {
    since: formatDatePtBr(team.since),
    untill: formatDatePtBr(team.untill),
    status: active ? tTeams("active") : tTeams("inactive"),
    leader: team.leader?.name ?? tTeams("noLeader"),
    exchangesFirstDay: tTeams("exchangesFirstDay"),
    exchangesLastDay: tTeams("exchangesLastDay"),
  };

  return (
    <TeamListRowPresentational team={team} variant={variant} labels={labels} />
  );
}
