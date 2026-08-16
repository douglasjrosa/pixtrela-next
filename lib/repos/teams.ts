import { and, asc, count, desc, eq, ilike, inArray, sql } from "drizzle-orm";

import { teamMembers, teams, users } from "@/drizzle/schema";
import { toCalendarDateKey } from "@/lib/business/datetime-timezone";
import { getDb, type Db } from "@/lib/db/client";
import type { TeamListSort } from "@/lib/schemas/team-list-sort";

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

async function loadColaboratorsByTeamIds(
  teamIds: string[],
  db: Db,
): Promise<Map<string, TeamMemberRef[]>> {
  const membersByTeam = new Map<string, TeamMemberRef[]>();
  if (teamIds.length === 0) return membersByTeam;

  const memberships = await db
    .select({
      teamId: teamMembers.teamId,
      userId: teamMembers.userId,
      name: users.name,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(inArray(teamMembers.teamId, teamIds));

  for (const membership of memberships) {
    const list = membersByTeam.get(membership.teamId) ?? [];
    list.push({ documentId: membership.userId, name: membership.name });
    membersByTeam.set(membership.teamId, list);
  }
  return membersByTeam;
}

export async function listTeamsWithMembers(
  db: Db = getDb(),
): Promise<TeamWithMembers[]> {
  const rows = await listTeams(db);
  if (rows.length === 0) return [];

  const membersByTeam = await loadColaboratorsByTeamIds(
    rows.map((row) => row.id),
    db,
  );

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

const TEAM_MEMBER_COUNT = sql<number>`
  (select count(*)::int from ${teamMembers} where ${teamMembers.teamId} = ${teams.id})
`;

function teamListOrderBy(sort: TeamListSort) {
  const dir = sort.direction === "desc" ? desc : asc;
  if (sort.column === "since") {
    return [dir(teams.since), asc(teams.name), asc(teams.id)];
  }
  if (sort.column === "untill") {
    return [dir(teams.until), asc(teams.name), asc(teams.id)];
  }
  if (sort.column === "exchangePeriod") {
    return [
      dir(teams.exchangesFirstDay),
      dir(teams.exchangesLastDay),
      asc(teams.name),
      asc(teams.id),
    ];
  }
  if (sort.column === "leader") {
    return [dir(users.name), asc(teams.name), asc(teams.id)];
  }
  if (sort.column === "members") {
    return [dir(TEAM_MEMBER_COUNT), asc(teams.name), asc(teams.id)];
  }
  return [dir(teams.name), asc(teams.id)];
}

export async function listTeamsPage(
  options: {
    q?: string;
    page?: number;
    pageSize?: number;
    sort?: TeamListSort;
    showArchived?: boolean;
  } = {},
  db: Db = getDb(),
): Promise<{ items: TeamWithMembers[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const offset = (page - 1) * pageSize;
  const q = options.q?.trim();
  const sort = options.sort ?? { column: "name", direction: "asc" };

  const activeClause = options.showArchived
    ? undefined
    : eq(teams.active, true);

  const searchClause = q ? ilike(teams.name, `%${q}%`) : undefined;

  const where = and(activeClause, searchClause);

  const [totalRow] = await db
    .select({ total: count() })
    .from(teams)
    .where(where);

  const rows = await db
    .select({
      ...TEAM_COLUMNS,
      leaderName: users.name,
    })
    .from(teams)
    .leftJoin(users, eq(teams.leaderId, users.id))
    .where(where)
    .orderBy(...teamListOrderBy(sort))
    .limit(pageSize)
    .offset(offset);

  const membersByTeam = await loadColaboratorsByTeamIds(
    rows.map((row) => row.id),
    db,
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      leaderId: row.leaderId,
      exchangesFirstDay: row.exchangesFirstDay,
      exchangesLastDay: row.exchangesLastDay,
      since: row.since,
      until: row.until,
      active: row.active,
      leader:
        row.leaderId && row.leaderName
          ? { documentId: row.leaderId, name: row.leaderName }
          : null,
      colaborators: membersByTeam.get(row.id) ?? [],
    })),
    total: totalRow?.total ?? 0,
  };
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
      active: input.until ? false : true,
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
    .set({
      active: false,
      until: toCalendarDateKey(new Date()),
      updatedAt: new Date(),
    })
    .where(eq(teams.id, id));
}

export async function findTeamById(
  id: string,
  db: Db = getDb(),
): Promise<TeamRecord | null> {
  const [row] = await db
    .select(TEAM_COLUMNS)
    .from(teams)
    .where(eq(teams.id, id))
    .limit(1);
  return row ?? null;
}

export async function hardDeleteTeam(
  id: string,
  db: Db = getDb(),
): Promise<void> {
  await db.delete(teams).where(eq(teams.id, id));
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
