import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  or,
  sql,
} from "drizzle-orm";

import {
  teams,
  users,
  workdays,
  workdaySlots,
  workdayTeams,
  workdayUsers,
} from "@/drizzle/schema";
import { DEACTIVATION_TABLE } from "@/lib/domain/deactivation-tables";
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
  allDay: boolean;
  startMinute: number | null;
  endMinute: number | null;
};

export type WorkdayRecord = {
  id: string;
  name: string;
  description: string | null;
  action: WorkdayAction;
  scope: WorkdayScope;
  timezone: string;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
};

export type WorkdayWithRelations = WorkdayRecord & {
  teams: WorkdayTargetRef[];
  users: WorkdayTargetRef[];
  slots: WorkdaySlotRecord[];
};

const WORKDAY_COLUMNS = {
  id: workdays.id,
  name: workdays.name,
  description: workdays.description,
  action: workdays.action,
  scope: workdays.scope,
  timezone: workdays.timezone,
  validFrom: workdays.validFrom,
  validUntil: workdays.validUntil,
  active: workdays.active,
} as const;

const WORKDAY_SLOT_COLUMNS = {
  id: workdaySlots.id,
  workdayId: workdaySlots.workdayId,
  isRecurrent: workdaySlots.isRecurrent,
  dayOfWeek: workdaySlots.dayOfWeek,
  date: workdaySlots.date,
  allDay: workdaySlots.allDay,
  startMinute: workdaySlots.startMinute,
  endMinute: workdaySlots.endMinute,
} as const;

const WORKDAY_SLOT_COUNT = sql<number>`
  (select count(*)::int from ${workdaySlots} where ${workdaySlots.workdayId} = ${workdays.id})
`;

type WriteWorkdayInput = {
  name: string;
  description: string | null;
  action: WorkdayAction;
  scope: WorkdayScope;
  timezone: string;
  validFrom: string | null;
  validUntil: string | null;
  teamIds: string[];
  userIds: string[];
  slots: WorkdaySlotInput[];
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
        allDay: slot.allDay,
        startMinute: slot.allDay ? null : slot.startMinute,
        endMinute: slot.allDay ? null : slot.endMinute,
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
        name: input.name.trim(),
        description: input.description,
        action: input.action,
        scope: input.scope,
        timezone: input.timezone,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
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
        name: input.name.trim(),
        description: input.description,
        action: input.action,
        scope: input.scope,
        timezone: input.timezone,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
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

function workdayListOrderBy(sort: WorkdayListSort) {
  const dir = sort.direction === "desc" ? desc : asc;
  if (sort.column === "action") {
    return [dir(workdays.action), asc(workdays.name), asc(workdays.id)];
  }
  if (sort.column === "scope") {
    return [dir(workdays.scope), asc(workdays.name), asc(workdays.id)];
  }
  if (sort.column === "validity") {
    return [
      dir(workdays.validFrom),
      dir(workdays.validUntil),
      asc(workdays.name),
      asc(workdays.id),
    ];
  }
  if (sort.column === "slots") {
    return [dir(WORKDAY_SLOT_COUNT), asc(workdays.name), asc(workdays.id)];
  }
  return [dir(workdays.name), asc(workdays.id)];
}

export async function listWorkdaysPage(
  options: {
    q?: string;
    action?: WorkdayAction;
    scope?: WorkdayScope;
    page?: number;
    pageSize?: number;
    sort?: WorkdayListSort;
    showArchived?: boolean;
  } = {},
  db: Db = getDb(),
): Promise<{ items: WorkdayWithRelations[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const offset = (page - 1) * pageSize;
  const q = options.q?.trim();
  const sort = options.sort ?? { column: "name", direction: "asc" };

  const activeClause = eq(workdays.active, !options.showArchived);
  const searchClause = q
    ? or(ilike(workdays.name, `%${q}%`), ilike(workdays.description, `%${q}%`))
    : undefined;
  const actionClause = options.action
    ? eq(workdays.action, options.action)
    : undefined;
  const scopeClause = options.scope
    ? eq(workdays.scope, options.scope)
    : undefined;

  const where = and(activeClause, searchClause, actionClause, scopeClause);

  const [totalRow] = await db
    .select({ total: count() })
    .from(workdays)
    .where(where);

  const rows = await db
    .select(WORKDAY_COLUMNS)
    .from(workdays)
    .where(where)
    .orderBy(...workdayListOrderBy(sort))
    .limit(pageSize)
    .offset(offset);

  const ids = rows.map((row) => row.id);
  const [teamsById, usersById, slotsById] = await Promise.all([
    loadTeamsByWorkdayIds(ids, db),
    loadUsersByWorkdayIds(ids, db),
    loadSlotsByWorkdayIds(ids, db),
  ]);

  return {
    items: rows.map((row) => ({
      ...row,
      teams: teamsById.get(row.id) ?? [],
      users: usersById.get(row.id) ?? [],
      slots: slotsById.get(row.id) ?? [],
    })),
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

export async function listWorkdayFormOptions(
  db: Db = getDb(),
): Promise<{ teams: WorkdayTargetRef[]; users: WorkdayTargetRef[] }> {
  const [teamRows, userRows] = await Promise.all([
    db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(eq(teams.active, true))
      .orderBy(asc(teams.name)),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(
        and(
          eq(users.active, true),
          eq(users.blocked, false),
          ne(users.role, "kiosk"),
        ),
      )
      .orderBy(asc(users.name)),
  ]);

  return {
    teams: teamRows.map((row) => ({ documentId: row.id, name: row.name })),
    users: userRows.map((row) => ({ documentId: row.id, name: row.name })),
  };
}
