import { TeamListRowView } from "./team-list-row";
import type { TeamRow } from "./types";

export interface TeamsListMobileListProps {
  teams: TeamRow[];
  showCheckboxColumn?: boolean;
}

export async function TeamsListMobileList({
  teams,
  showCheckboxColumn = false,
}: TeamsListMobileListProps) {
  return (
    <ul className="md:hidden">
      {teams.map((team) => (
        <TeamListRowView
          key={team.documentId}
          team={team}
          variant="mobile"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </ul>
  );
}
