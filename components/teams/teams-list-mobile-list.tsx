import { TeamListRowView } from "./team-list-row";
import type { TeamRow } from "./types";

export interface TeamsListMobileListProps {
  teams: TeamRow[];
}

export async function TeamsListMobileList({ teams }: TeamsListMobileListProps) {
  return (
    <ul className="md:hidden">
      {teams.map((team) => (
        <TeamListRowView
          key={team.documentId}
          team={team}
          variant="mobile"
        />
      ))}
    </ul>
  );
}
