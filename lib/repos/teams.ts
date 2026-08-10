import { and, eq, inArray } from "drizzle-orm";

import { teamMembers, teams, users } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

export type TeamRecord = {
  id: string;
  name: string;
  leaderId: string | null;
  exchangesFirstDay: number;
  exchangesLastDay: number;
  since: string | null;
  until: string | null;
  active: boolean;
};

export type TeamMemberRef = {
  documentId: string;
  name: string;
};

export type TeamWithMembers = TeamRecord & {
  leader: TeamMemberRef | null;
  colaborators: TeamMemberRef[];
};

const TEAM_COLUMNS = {
  id: teams.id,
  name: teams.name,
  leaderId: teams.leaderId,
  exchangesFirstDay: teams.exchangesFirstDay,
  exchangesLastDay: teams.exchangesLastDay,
  since: teams.since,
  until: teams.until,
  active: teams.active,
} as const;

export async function createTeam(
  input: {
    name: string;
    leaderId?: string | null;
    exchangesFirstDay?: number;
    exchangesLastDay?: number;
    memberIds?: string[];
    since?: string | null;
  },
  db: Db = getDb(),
): Promise<TeamRecord> {
  const [row] = await db
    .insert(teams)
    .values({
      name: input.name.trim(),
      leaderId: input.leaderId ?? null,
      exchangesFirstDay: input.exchangesFirstDay ?? 3,
      exchangesLastDay: input.exchangesLastDay ?? 15,
      since: input.since ?? null,
    })
    .returning(TEAM_COLUMNS);

  if (input.memberIds?.length) {
    await db.insert(teamMembers).values(
      input.memberIds.map((userId) => ({
        teamId: row.id,
        userId,
      })),
    );
  }

  return row;
}

export async function listTeams(db: Db = getDb()): Promise<TeamRecord[]> {
  return db.select(TEAM_COLUMNS).from(teams).orderBy(teams.name);
}

export async function listActiveTeams(db: Db = getDb()): Promise<TeamRecord[]> {
  return db
    .select(TEAM_COLUMNS)
    .from(teams)
    .where(eq(teams.active, true))
    .orderBy(teams.name);
}

export async function listTeamsWithMembers(
  db: Db = getDb(),
): Promise<TeamWithMembers[]> {
  const rows = await listTeams(db);
  if (rows.length === 0) return [];

  const teamIds = rows.map((row) => row.id);
  const memberships = await db
    .select({
      teamId: teamMembers.teamId,
      userId: teamMembers.userId,
      name: users.name,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(inArray(teamMembers.teamId, teamIds));

  const membersByTeam = new Map<string, TeamMemberRef[]>();
  for (const membership of memberships) {
    const list = membersByTeam.get(membership.teamId) ?? [];
    list.push({ documentId: membership.userId, name: membership.name });
    membersByTeam.set(membership.teamId, list);
  }

  const leaderIds = rows
    .map((row) => row.leaderId)
    .filter((id): id is string => Boolean(id));
  const leaders =
    leaderIds.length === 0
      ? []
      : await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, leaderIds));
  const leaderById = new Map(leaders.map((leader) => [leader.id, leader]));

  return rows.map((row) => {
    const leader = row.leaderId ? leaderById.get(row.leaderId) : null;
    return {
      ...row,
      leader: leader
        ? { documentId: leader.id, name: leader.name }
        : null,
      colaborators: membersByTeam.get(row.id) ?? [],
    };
  });
}

export async function listTeamMemberIds(
  teamId: string,
  db: Db = getDb(),
): Promise<string[]> {
  const rows = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));
  return rows.map((row) => row.userId);
}

export async function replaceTeamMembers(
  teamId: string,
  memberIds: string[],
  db: Db = getDb(),
): Promise<void> {
  await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
  if (memberIds.length === 0) return;
  await db.insert(teamMembers).values(
    memberIds.map((userId) => ({ teamId, userId })),
  );
}

export async function updateTeam(
  input: {
    id: string;
    name: string;
    leaderId?: string | null;
    exchangesFirstDay: number;
    exchangesLastDay: number;
    until?: string | null;
    memberIds?: string[];
  },
  db: Db = getDb(),
): Promise<TeamRecord> {
  const [row] = await db
    .update(teams)
    .set({
      name: input.name.trim(),
      leaderId: input.leaderId ?? null,
      exchangesFirstDay: input.exchangesFirstDay,
      exchangesLastDay: input.exchangesLastDay,
      until: input.until ?? null,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, input.id))
    .returning(TEAM_COLUMNS);
  if (!row) throw new Error("teamNotFound");

  if (input.memberIds) {
    await replaceTeamMembers(input.id, input.memberIds, db);
  }
  return row;
}

export async function deleteTeam(
  id: string,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(teams)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(teams.id, id));
}

export async function findActiveTeamWindowForUser(
  userId: string,
  db: Db = getDb(),
): Promise<{ exchangesFirstDay: number; exchangesLastDay: number } | null> {
  const [membership] = await db
    .select({
      exchangesFirstDay: teams.exchangesFirstDay,
      exchangesLastDay: teams.exchangesLastDay,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(and(eq(teamMembers.userId, userId), eq(teams.active, true)))
    .limit(1);
  return membership ?? null;
}
