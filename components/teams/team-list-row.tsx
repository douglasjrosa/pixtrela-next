import { getTranslations } from "next-intl/server";

import { formatDatePtBr } from "@/lib/format/datetime";

import {
  TeamListRowPresentational,
  type TeamListRowLabels,
} from "./team-list-row-presentational";
import type { TeamRow } from "./types";

export interface TeamListRowProps {
  team: TeamRow;
  variant: "table" | "mobile";
  showCheckboxColumn?: boolean;
  showUntillColumn?: boolean;
}

export async function TeamListRowView({
  team,
  variant,
  showCheckboxColumn = false,
  showUntillColumn = false,
}: TeamListRowProps) {
  const tTeams = await getTranslations("teams");
  const tCommon = await getTranslations("common");
  const labels: TeamListRowLabels = {
    since: formatDatePtBr(team.since),
    untill: formatDatePtBr(team.untill),
    exchangePeriod: tTeams("exchangePeriodRange", {
      firstDay: team.exchangesFirstDay,
      lastDay: team.exchangesLastDay,
    }),
    leader: team.leader?.name ?? tTeams("noLeader"),
    inactive: tTeams("inactive"),
    selectRow: tCommon("selectRow", { name: team.name }),
  };

  return (
    <TeamListRowPresentational
      team={team}
      variant={variant}
      labels={labels}
      showCheckboxColumn={showCheckboxColumn}
      showUntillColumn={showUntillColumn}
    />
  );
}
