import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_LIST_PAGE_SHELL_CLASS } from "@/components/layout/app-page-layout";
import { TeamManager, type TeamRow, type UserOption } from "@/components/teams/team-manager";
import type { Role } from "@/lib/auth/nav";
import { canManageTeams } from "@/lib/auth/permissions";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import { createTeam, deleteTeam, updateTeam } from "./actions";

interface StrapiList<T> {
  data: T[];
}

interface TeamEntity {
  documentId: string;
  name: string;
  exchangesFirstDay: number;
  exchangesLastDay: number;
  since?: string | null;
  untill?: string | null;
  leader?: { documentId: string; name?: string } | null;
  colaborators?: { documentId: string; name?: string }[] | null;
}

interface UserEntity {
  documentId?: string;
  id: number;
  name?: string;
  username: string;
}

async function loadTeams(): Promise<TeamRow[]> {
  try {
    const res = await strapiFetch<StrapiList<TeamEntity>>(
      "/teams",
      { strapiCache: { tags: [STRAPI_TAGS.teams], revalidate: 60 } },
      {
        fields: [
          "documentId",
          "name",
          "exchangesFirstDay",
          "exchangesLastDay",
          "since",
          "untill",
        ],
        populate: {
          leader: { fields: ["documentId", "name"] },
          colaborators: { fields: ["documentId", "name"] },
        },
        sort: "name:asc",
      },
    );
    return res.data.map((team) => ({
      documentId: team.documentId,
      name: team.name,
      exchangesFirstDay: team.exchangesFirstDay,
      exchangesLastDay: team.exchangesLastDay,
      since: team.since ?? null,
      untill: team.untill ?? null,
      leader: team.leader
        ? {
            documentId: team.leader.documentId,
            name: team.leader.name ?? "",
          }
        : null,
      colaborators:
        team.colaborators?.map((colaborator) => ({
          documentId: colaborator.documentId,
          name: colaborator.name ?? "",
        })) ?? [],
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

async function loadUsersByRole(roleType: Role): Promise<UserOption[]> {
  try {
    const res = await strapiFetch<UserEntity[]>(
      "/users",
      { strapiCache: { tags: [STRAPI_TAGS.users], revalidate: 60 } },
      {
        fields: ["documentId", "name", "username"],
        filters: { roleType: { $eq: roleType } },
      },
    );
    return res.map((user) => ({
      documentId: user.documentId ?? String(user.id),
      name: user.name ?? user.username,
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
