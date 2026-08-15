import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_LIST_PAGE_SHELL_CLASS } from "@/components/layout/app-page-layout";
import { TeamManager, type TeamRow, type UserOption } from "@/components/teams/team-manager";
import type { Role } from "@/lib/auth/nav";
import { canManageTeams } from "@/lib/auth/permissions";
import { listTeamsWithMembers } from "@/lib/repos/teams";
import { listUsersByRole } from "@/lib/repos/users";

import { createTeam, deleteTeam, updateTeam } from "./actions";

async function loadTeams(): Promise<TeamRow[]> {
  try {
    const rows = await listTeamsWithMembers();
    return rows
      .filter((team) => team.active)
      .map((team) => ({
        documentId: team.id,
        name: team.name,
        exchangesFirstDay: team.exchangesFirstDay,
        exchangesLastDay: team.exchangesLastDay,
        since: team.since,
        untill: team.until,
        leader: team.leader,
        colaborators: team.colaborators,
      }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

async function loadUsersByRole(roleType: Role): Promise<UserOption[]> {
  if (roleType !== "leader" && roleType !== "colaborator") return [];
  try {
    const rows = await listUsersByRole(roleType);
    return rows
      .filter((user) => user.active && !user.blocked)
      .map((user) => ({
        documentId: user.id,
        name: user.name,
      }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function TeamsPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTeams(role)) {
    return <ForbiddenMessage />;
  }

  const [teams, leaders, colaborators] = await Promise.all([
    loadTeams(),
    loadUsersByRole("leader"),
    loadUsersByRole("colaborator"),
  ]);

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <TeamManager
        teams={teams}
        leaders={leaders}
        colaborators={colaborators}
        onCreate={createTeam}
        onUpdate={updateTeam}
        onDelete={deleteTeam}
      />
    </section>
  );
}
