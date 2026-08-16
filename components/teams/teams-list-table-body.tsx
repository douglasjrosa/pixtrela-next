import { TeamListRowView } from "./team-list-row";
import type { TeamRow } from "./types";

export interface TeamsListTableBodyProps {
  teams: TeamRow[];
}

export async function TeamsListTableBody({ teams }: TeamsListTableBodyProps) {
  return (
    <tbody>
      {teams.map((team) => (
        <TeamListRowView
          key={team.documentId}
          team={team}
          variant="table"
        />
      ))}
    </tbody>
  );
}
