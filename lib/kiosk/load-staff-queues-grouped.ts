import { and, asc, eq, inArray } from "drizzle-orm";

import { mediaAssets, teamMembers, teams, users } from "@/drizzle/schema";
import type { KioskStaffRole } from "@/lib/business/kiosk-staff-access";
import { getDb, type Db } from "@/lib/db/client";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

export type StaffQueueMember = {
  documentId: string;
  name: string;
  code: number | null;
  facePhotoUrl?: string | null;
};

export type StaffQueueTeam = {
  teamId: string;
  teamName: string;
  members: StaffQueueMember[];
};

export type StaffQueuesGrouped = {
  teams: StaffQueueTeam[];
};

/**
 * Lists active teams the staff may manage, each with its active unblocked
 * colaborators. Leaders see only teams they lead; manager+ see all active
 * teams. A colaborator in N teams appears once per team section.
 */
export async function loadStaffQueuesGrouped(
  staffUserId: string,
  staffRole: KioskStaffRole,
  db: Db = getDb(),
): Promise<StaffQueuesGrouped> {
  const teamRows = await loadStaffTeams(staffUserId, staffRole, db);
  if (teamRows.length === 0) return { teams: [] };

  const membersByTeam = await loadColaboratorsByTeam(
    teamRows.map((team) => team.id),
    db,
  );

  return {
    teams: teamRows.map((team) => ({
      teamId: team.id,
      teamName: team.name,
      members: membersByTeam.get(team.id) ?? [],
    })),
  };
}

async function loadStaffTeams(
  staffUserId: string,
  staffRole: KioskStaffRole,
  db: Db,
): Promise<Array<{ id: string; name: string }>> {
  const activeClause = eq(teams.active, true);
  const where =
    staffRole === "leader"
      ? and(activeClause, eq(teams.leaderId, staffUserId))
      : activeClause;

  return db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(where)
    .orderBy(asc(teams.name));
}

async function loadColaboratorsByTeam(
  teamIds: string[],
  db: Db,
): Promise<Map<string, StaffQueueMember[]>> {
  const rows = await db
    .select({
      teamId: teamMembers.teamId,
      documentId: users.id,
      name: users.name,
      code: users.code,
      facePhotoUrl: mediaAssets.url,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .leftJoin(mediaAssets, eq(users.facePhotoMediaId, mediaAssets.id))
    .where(
      and(
        inArray(teamMembers.teamId, teamIds),
        eq(users.role, "colaborator"),
        eq(users.active, true),
        eq(users.blocked, false),
      ),
    )
    .orderBy(asc(users.name));

  const membersByTeam = new Map<string, StaffQueueMember[]>();
  for (const row of rows) {
    const list = membersByTeam.get(row.teamId) ?? [];
    list.push({
      documentId: row.documentId,
      name: row.name,
      code: row.code,
      facePhotoUrl: toBrowserMediaUrl(row.facePhotoUrl),
    });
    membersByTeam.set(row.teamId, list);
  }
  return membersByTeam;
}
