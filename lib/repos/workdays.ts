import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

import {
  teamMembers,
  teams,
  users,
  workdays,
  workdaySlots,
  workdayTeams,
  workdayUsers,
} from "@/drizzle/schema";
import { DEACTIVATION_TABLE } from "@/lib/domain/deactivation-tables";
import type { WorkdayPolicySnapshot } from "@/lib/domain/workday-write-policy";
import { getDb, type Db } from "@/lib/db/client";
import { archiveRecords } from "@/lib/repos/deactivation-reasons";
import type {
  WorkdayAction,
  WorkdayScope,
  WorkdaySlotInput,
} from "@/lib/schemas/workday";
import type { WorkdayListSort } from "@/lib/schemas/workday-list-sort";

export type WorkdayTargetRef = {
  documentId: string;
  name: string;
};

export type WorkdaySlotRecord = {
  id: string;
  workdayId: string;
  isRecurrent: boolean;
  dayOfWeek: number | null;
  date: string | null;
  startMinute: number;
  endMinute: number;
};

export type WorkdayRecord = {
  id: string;
  description: string | null;
  action: WorkdayAction;
  scope: WorkdayScope;
  timezone: string;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkdayWithRelations = WorkdayRecord & {
  teams: WorkdayTargetRef[];
  users: WorkdayTargetRef[];
  slots: WorkdaySlotRecord[];
};

export type WorkdayListViewer = {
  role: "admin" | "manager" | "leader";
  userId: string;
  teamIds: string[];
  userIds: string[];
};

const WORKDAY_COLUMNS = {
  id: workdays.id,
  description: workdays.description,
  action: workdays.action,
  scope: workdays.scope,
  timezone: workdays.timezone,
  validFrom: workdays.validFrom,
  validUntil: workdays.validUntil,
  active: workdays.active,
  createdBy: workdays.createdBy,
  updatedBy: workdays.updatedBy,
  createdAt: workdays.createdAt,
  updatedAt: workdays.updatedAt,
} as const;

const WORKDAY_SLOT_COLUMNS = {
  id: workdaySlots.id,
  workdayId: workdaySlots.workdayId,
  isRecurrent: workdaySlots.isRecurrent,
  dayOfWeek: workdaySlots.dayOfWeek,
  date: workdaySlots.date,
  startMinute: workdaySlots.startMinute,
  endMinute: workdaySlots.endMinute,
} as const;

const WORKDAY_SLOT_COUNT = sql<number>`
  (select count(*)::int from ${workdaySlots}
    where ${workdaySlots.workdayId} = ${workdays.id})
`;

const IS_RECURRENT_ROW = sql<boolean>`
  exists (
    select 1 from ${workdaySlots} s
    where s.workday_id = ${workdays.id} and s.is_recurrent = true
  )
`;

type WriteWorkdayInput = {
  description: string | null;
  action: WorkdayAction;
  scope: WorkdayScope;
  timezone: string;
  validFrom: string | null;
  validUntil: string | null;
  teamIds: string[];
  userIds: string[];
  slots: WorkdaySlotInput[];
  actorUserId?: string | null;
};

async function replaceWorkdayRelations(
  workdayId: string,
  input: Pick<WriteWorkdayInput, "scope" | "teamIds" | "userIds" | "slots">,
  tx: Pick<Db, "delete" | "insert">,
): Promise<void> {
  await tx.delete(workdayTeams).where(eq(workdayTeams.workdayId, workdayId));
  await tx.delete(workdayUsers).where(eq(workdayUsers.workdayId, workdayId));
  await tx.delete(workdaySlots).where(eq(workdaySlots.workdayId, workdayId));

  if (input.scope === "team" && input.teamIds.length > 0) {
    await tx.insert(workdayTeams).values(
      input.teamIds.map((teamId) => ({ workdayId, teamId })),
    );
  }

  if (input.scope === "user" && input.userIds.length > 0) {
    await tx.insert(workdayUsers).values(
      input.userIds.map((userId) => ({ workdayId, userId })),
    );
  }

  if (input.slots.length > 0) {
    await tx.insert(workdaySlots).values(
      input.slots.map((slot) => ({
        workdayId,
        isRecurrent: slot.isRecurrent,
        dayOfWeek: slot.isRecurrent ? slot.dayOfWeek : null,
        date: slot.isRecurrent ? null : slot.date,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
      })),
    );
  }
}

export async function createWorkday(
  input: WriteWorkdayInput,
  db: Db = getDb(),
): Promise<WorkdayRecord> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(workdays)
      .values({
        description: input.description,
        action: input.action,
        scope: input.scope,
        timezone: input.timezone,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        createdBy: input.actorUserId ?? null,
        updatedBy: input.actorUserId ?? null,
      })
      .returning(WORKDAY_COLUMNS);

    await replaceWorkdayRelations(row.id, input, tx);
    return row;
  });
}

export async function updateWorkday(
  id: string,
  input: WriteWorkdayInput,
  db: Db = getDb(),
): Promise<WorkdayRecord> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(workdays)
      .set({
        description: input.description,
        action: input.action,
        scope: input.scope,
        timezone: input.timezone,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        updatedBy: input.actorUserId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(workdays.id, id))
      .returning(WORKDAY_COLUMNS);

    if (!row) throw new Error("workdayNotFound");

    await replaceWorkdayRelations(id, input, tx);
    return row;
  });
}

async function loadTeamsByWorkdayIds(
  workdayIds: string[],
  db: Db,
): Promise<Map<string, WorkdayTargetRef[]>> {
  const byWorkday = new Map<string, WorkdayTargetRef[]>();
  if (workdayIds.length === 0) return byWorkday;

  const rows = await db
    .select({
      workdayId: workdayTeams.workdayId,
      teamId: workdayTeams.teamId,
      name: teams.name,
    })
    .from(workdayTeams)
    .innerJoin(teams, eq(workdayTeams.teamId, teams.id))
    .where(inArray(workdayTeams.workdayId, workdayIds))
    .orderBy(asc(teams.name));

  for (const row of rows) {
    const list = byWorkday.get(row.workdayId) ?? [];
    list.push({ documentId: row.teamId, name: row.name });
    byWorkday.set(row.workdayId, list);
  }
  return byWorkday;
}

async function loadUsersByWorkdayIds(
  workdayIds: string[],
  db: Db,
): Promise<Map<string, WorkdayTargetRef[]>> {
  const byWorkday = new Map<string, WorkdayTargetRef[]>();
  if (workdayIds.length === 0) return byWorkday;

  const rows = await db
    .select({
      workdayId: workdayUsers.workdayId,
      userId: workdayUsers.userId,
      name: users.name,
    })
    .from(workdayUsers)
    .innerJoin(users, eq(workdayUsers.userId, users.id))
    .where(inArray(workdayUsers.workdayId, workdayIds))
    .orderBy(asc(users.name));

  for (const row of rows) {
    const list = byWorkday.get(row.workdayId) ?? [];
    list.push({ documentId: row.userId, name: row.name });
    byWorkday.set(row.workdayId, list);
  }
  return byWorkday;
}

async function loadSlotsByWorkdayIds(
  workdayIds: string[],
  db: Db,
): Promise<Map<string, WorkdaySlotRecord[]>> {
  const byWorkday = new Map<string, WorkdaySlotRecord[]>();
  if (workdayIds.length === 0) return byWorkday;

  const rows = await db
    .select(WORKDAY_SLOT_COLUMNS)
    .from(workdaySlots)
    .where(inArray(workdaySlots.workdayId, workdayIds))
    .orderBy(
      desc(workdaySlots.isRecurrent),
      asc(workdaySlots.dayOfWeek),
      asc(workdaySlots.date),
      asc(workdaySlots.startMinute),
    );

  for (const row of rows) {
    const list = byWorkday.get(row.workdayId) ?? [];
    list.push(row);
    byWorkday.set(row.workdayId, list);
  }
  return byWorkday;
}

async function attachRelations(
  rows: WorkdayRecord[],
  db: Db,
): Promise<WorkdayWithRelations[]> {
  const ids = rows.map((row) => row.id);
  const [teamsById, usersById, slotsById] = await Promise.all([
    loadTeamsByWorkdayIds(ids, db),
    loadUsersByWorkdayIds(ids, db),
    loadSlotsByWorkdayIds(ids, db),
  ]);
  return rows.map((row) => ({
    ...row,
    teams: teamsById.get(row.id) ?? [],
    users: usersById.get(row.id) ?? [],
    slots: slotsById.get(row.id) ?? [],
  }));
}

function workdayAvulsoOrderBy(sort: WorkdayListSort) {
  const dir = sort.direction === "desc" ? desc : asc;
  if (sort.column === "action") {
    return [dir(workdays.action), desc(workdays.createdAt), asc(workdays.id)];
  }
  if (sort.column === "scope") {
    return [dir(workdays.scope), desc(workdays.createdAt), asc(workdays.id)];
  }
  if (sort.column === "validity") {
    return [
      dir(workdays.validFrom),
      dir(workdays.validUntil),
      desc(workdays.createdAt),
      asc(workdays.id),
    ];
  }
  if (sort.column === "slots") {
    return [dir(WORKDAY_SLOT_COUNT), desc(workdays.createdAt), asc(workdays.id)];
  }
  return [dir(workdays.createdAt), asc(workdays.id)];
}

function searchClause(q: string) {
  const pattern = `%${q}%`;
  return or(
    ilike(workdays.description, pattern),
    sql`exists (
      select 1 from ${workdayUsers}
      inner join ${users} on ${users.id} = ${workdayUsers.userId}
      where ${workdayUsers.workdayId} = ${workdays.id}
        and ${users.name} ilike ${pattern}
    )`,
    sql`exists (
      select 1 from ${workdayTeams}
      inner join ${teams} on ${teams.id} = ${workdayTeams.teamId}
      where ${workdayTeams.workdayId} = ${workdays.id}
        and ${teams.name} ilike ${pattern}
    )`,
  );
}

function slotDateClause(dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) return undefined;
  const fromBound = dateFrom
    ? sql`and s.date >= ${dateFrom}`
    : sql``;
  const toBound = dateTo ? sql`and s.date <= ${dateTo}` : sql``;
  return sql`(
    exists (
      select 1 from ${workdaySlots} s
      where s.workday_id = ${workdays.id} and s.is_recurrent = true
    )
    or exists (
      select 1 from ${workdaySlots} s
      where s.workday_id = ${workdays.id}
        and s.is_recurrent = false
        ${fromBound}
        ${toBound}
    )
  )`;
}

function sqlUuidInList(columnSql: ReturnType<typeof sql>, ids: string[]) {
  return sql`${columnSql} in (${sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  )})`;
}

function leaderVisibilityClause(viewer: WorkdayListViewer) {
  const teamFilter =
    viewer.teamIds.length > 0
      ? sql`exists (
          select 1 from ${workdayTeams} wt
          where wt.workday_id = ${workdays.id}
            and ${sqlUuidInList(sql`wt.team_id`, viewer.teamIds)}
        )`
      : sql`false`;
  const userFilter =
    viewer.userIds.length > 0
      ? sql`exists (
          select 1 from ${workdayUsers} wu
          where wu.workday_id = ${workdays.id}
            and ${sqlUuidInList(sql`wu.user_id`, viewer.userIds)}
        )`
      : sql`false`;
  return sql`(
    ${workdays.scope} = 'global'
    or (${workdays.scope} = 'team' and ${teamFilter})
    or (${workdays.scope} = 'user' and ${userFilter})
  )`;
}

export async function listWorkdaysPage(
  options: {
    q?: string;
    action?: WorkdayAction;
    scope?: WorkdayScope;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
    sort?: WorkdayListSort;
    showArchived?: boolean;
    viewer?: WorkdayListViewer;
  } = {},
  db: Db = getDb(),
): Promise<{ items: WorkdayWithRelations[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const offset = (page - 1) * pageSize;
  const q = options.q?.trim();
  const sort = options.sort ?? { column: "createdAt", direction: "desc" };

  const activeClause = eq(workdays.active, !options.showArchived);
  const qClause = q ? searchClause(q) : undefined;
  const actionClause = options.action
    ? eq(workdays.action, options.action)
    : undefined;
  const scopeClause = options.scope
    ? eq(workdays.scope, options.scope)
    : undefined;
  const datesClause = slotDateClause(options.dateFrom, options.dateTo);
  const viewerClause =
    options.viewer?.role === "leader"
      ? leaderVisibilityClause(options.viewer)
      : undefined;

  const where = and(
    activeClause,
    qClause,
    actionClause,
    scopeClause,
    datesClause,
    viewerClause,
  );

  const [totalRow] = await db
    .select({ total: count() })
    .from(workdays)
    .where(where);

  const rows = await db
    .select(WORKDAY_COLUMNS)
    .from(workdays)
    .where(where)
    .orderBy(desc(IS_RECURRENT_ROW), ...workdayAvulsoOrderBy(sort))
    .limit(pageSize)
    .offset(offset);

  return {
    items: await attachRelations(rows, db),
    total: totalRow?.total ?? 0,
  };
}

export async function findWorkdayById(
  id: string,
  db: Db = getDb(),
): Promise<WorkdayRecord | null> {
  const [row] = await db
    .select(WORKDAY_COLUMNS)
    .from(workdays)
    .where(eq(workdays.id, id))
    .limit(1);
  return row ?? null;
}

export async function findWorkdayWithRelations(
  id: string,
  db: Db = getDb(),
): Promise<WorkdayWithRelations | null> {
  const row = await findWorkdayById(id, db);
  if (!row) return null;
  const [withRelations] = await attachRelations([row], db);
  return withRelations ?? null;
}

export function toWorkdayPolicySnapshot(
  row: WorkdayWithRelations,
): WorkdayPolicySnapshot {
  return {
    action: row.action,
    scope: row.scope,
    timezone: row.timezone,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    description: row.description,
    userIds: row.users.map((user) => user.documentId),
    teamIds: row.teams.map((team) => team.documentId),
    slots: row.slots.map((slot) => ({
      isRecurrent: slot.isRecurrent,
      date: slot.date,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
    })),
  };
}

export async function archiveWorkdays(
  ids: string[],
  reason: string,
  db: Db = getDb(),
): Promise<void> {
  await archiveRecords(
    {
      tableName: DEACTIVATION_TABLE.workdays,
      recordIds: ids,
      text: reason,
      setInactive: async (recordIds, tx) => {
        await tx
          .update(workdays)
          .set({ active: false, updatedAt: new Date() })
          .where(inArray(workdays.id, recordIds));
      },
    },
    db,
  );
}

export async function reactivateWorkdays(
  ids: string[],
  db: Db = getDb(),
): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(workdays)
    .set({ active: true, updatedAt: new Date() })
    .where(inArray(workdays.id, ids));
}

export async function hardDeleteWorkday(
  id: string,
  db: Db = getDb(),
): Promise<void> {
  await db.delete(workdays).where(eq(workdays.id, id));
}

export async function listLeaderWorkdayScope(
  leaderUserId: string,
  db: Db = getDb(),
): Promise<{ teamIds: string[]; userIds: string[] }> {
  const leaderTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.leaderId, leaderUserId), eq(teams.active, true)));
  const teamIds = leaderTeams.map((team) => team.id);
  if (teamIds.length === 0) return { teamIds: [], userIds: [] };

  const members = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(inArray(teamMembers.teamId, teamIds));

  return {
    teamIds,
    userIds: [...new Set(members.map((member) => member.userId))],
  };
}

export async function listWorkdayFormOptions(
  options: { leaderUserId?: string } = {},
  db: Db = getDb(),
): Promise<{ teams: WorkdayTargetRef[]; users: WorkdayTargetRef[] }> {
  const leaderScope = options.leaderUserId
    ? await listLeaderWorkdayScope(options.leaderUserId, db)
    : null;

  const teamFilter = leaderScope
    ? leaderScope.teamIds.length > 0
      ? inArray(teams.id, leaderScope.teamIds)
      : sql`false`
    : eq(teams.active, true);

  const userFilter = leaderScope
    ? leaderScope.userIds.length > 0
      ? inArray(users.id, leaderScope.userIds)
      : sql`false`
    : and(
        eq(users.active, true),
        eq(users.blocked, false),
        notInArray(users.role, ["kiosk", "panel"]),
      );

  const [teamRows, userRows] = await Promise.all([
    db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(and(eq(teams.active, true), teamFilter))
      .orderBy(asc(teams.name)),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.active, true), eq(users.blocked, false), userFilter))
      .orderBy(asc(users.name)),
  ]);

  return {
    teams: teamRows.map((row) => ({ documentId: row.id, name: row.name })),
    users: userRows.map((row) => ({ documentId: row.id, name: row.name })),
  };
}
