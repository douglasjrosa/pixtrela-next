import { and, asc, eq, inArray } from "drizzle-orm";

import { mediaAssets, teamMembers, teams, users } from "@/drizzle/schema";
import type { KioskStaffRole } from "@/lib/business/kiosk-staff-access";
import { getDb, type Db } from "@/lib/db/client";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import {
  loadLatestActivitiesByColaboratorIds,
  type ColaboratorLatestActivitySummary,
} from "@/lib/repos/activities";
import { appendTeamLeaderAsLastMember } from "@/lib/business/team-leader-assignee";
import { listStaffOpenSessionLabels, type StaffOpenSessionLabel } from "@/lib/repos/group-runs";

export type StaffQueueMemberLastActivity = Omit<
  ColaboratorLatestActivitySummary,
  "colaboratorId"
>;

export type StaffQueueMember = {
  documentId: string;
  name: string;
  code: number | null;
  facePhotoUrl?: string | null;
  lastActivity: StaffQueueMemberLastActivity | null;
  isLeader?: boolean;
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

  const teamIds = teamRows.map((team) => team.id);
  const membersByTeam = await loadColaboratorsByTeam(teamIds, db);
  const membersWithLeaders = new Map(
    teamRows.map((team) => [
      team.id,
      appendTeamLeaderAsLastMember(
        membersByTeam.get(team.id) ?? [],
        toQueueLeaderMember(team),
      ),
    ]),
  );
  const colaboratorIds = [
    ...new Set(
      teamIds.flatMap((teamId) =>
        (membersWithLeaders.get(teamId) ?? []).map((member) => member.documentId),
      ),
    ),
  ];
  const latestActivities = await loadLatestActivitiesByColaboratorIds(
    colaboratorIds,
    db,
  );
  const openLabels = await listStaffOpenSessionLabels(colaboratorIds, db);

  return {
    teams: teamRows.map((team) => ({
      teamId: team.id,
      teamName: team.name,
      members: (membersWithLeaders.get(team.id) ?? []).map((member) => ({
        ...member,
        lastActivity: openSessionActivity(openLabels.get(member.documentId))
          ?? toMemberLastActivity(latestActivities.get(member.documentId)),
      })),
    })),
  };
}

function openSessionActivity(
  row: StaffOpenSessionLabel | undefined,
): StaffQueueMemberLastActivity | null {
  if (!row) return null;
  return {
    action: row.action,
    timestamp: row.timestamp,
    subTaskName: row.subTaskName,
    taskName: row.taskName,
    taskQty: row.taskQty,
    taskCrmItemKey: row.taskCrmItemKey,
    taskDeliveryDate: row.taskDeliveryDate,
  };
}

function toMemberLastActivity(
  row: ColaboratorLatestActivitySummary | undefined,
): StaffQueueMemberLastActivity | null {
  if (!row) return null;
  const { colaboratorId, ...rest } = row;
  void colaboratorId;
  return rest;
}

type StaffTeamRow = {
  id: string;
  name: string;
  leaderId: string | null;
  leaderName: string | null;
  leaderCode: number | null;
  leaderFacePhotoUrl: string | null;
  leaderActive: boolean | null;
  leaderBlocked: boolean | null;
};

function toQueueLeaderMember(
  team: StaffTeamRow,
): StaffQueueMember | null {
  if (
    !team.leaderId
    || !team.leaderName
    || !team.leaderActive
    || team.leaderBlocked
  ) {
    return null;
  }
  return {
    documentId: team.leaderId,
    name: team.leaderName,
    code: team.leaderCode,
    facePhotoUrl: toBrowserMediaUrl(team.leaderFacePhotoUrl),
    lastActivity: null,
  };
}

async function loadStaffTeams(
  staffUserId: string,
  staffRole: KioskStaffRole,
  db: Db,
): Promise<StaffTeamRow[]> {
  const activeClause = eq(teams.active, true);
  const where =
    staffRole === "leader"
      ? and(activeClause, eq(teams.leaderId, staffUserId))
      : activeClause;

  return db
    .select({
      id: teams.id,
      name: teams.name,
      leaderId: teams.leaderId,
      leaderName: users.name,
      leaderCode: users.code,
      leaderFacePhotoUrl: mediaAssets.url,
      leaderActive: users.active,
      leaderBlocked: users.blocked,
    })
    .from(teams)
    .leftJoin(users, eq(teams.leaderId, users.id))
    .leftJoin(mediaAssets, eq(users.facePhotoMediaId, mediaAssets.id))
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
      lastActivity: null,
    });
    membersByTeam.set(row.teamId, list);
  }
  return membersByTeam;
}
