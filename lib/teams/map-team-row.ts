import type { TeamRow } from "@/components/teams/types";
import type { TeamWithMembers } from "@/lib/repos/teams";

export function mapTeamWithMembersToRow(team: TeamWithMembers): TeamRow {
  return {
    documentId: team.id,
    name: team.name,
    exchangesFirstDay: team.exchangesFirstDay,
    exchangesLastDay: team.exchangesLastDay,
    since: team.since,
    untill: team.until,
    leader: team.leader,
    colaborators: team.colaborators,
  };
}
