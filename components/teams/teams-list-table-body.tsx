import { TeamListRowView } from "./team-list-row";
import type { TeamRow } from "./types";

export interface TeamsListTableBodyProps {
  teams: TeamRow[];
  showCheckboxColumn?: boolean;
}

export async function TeamsListTableBody({
  teams,
  showCheckboxColumn = false,
}: TeamsListTableBodyProps) {
  return (
    <tbody>
      {teams.map((team) => (
        <TeamListRowView
          key={team.documentId}
          team={team}
          variant="table"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </tbody>
  );
}
