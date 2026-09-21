import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";

import {
  activities,
  currencies,
  currencyForSubtasks,
  subTasks,
  tasks,
  users,
} from "@/drizzle/schema";
import { DEFAULT_TIME_ZONE } from "@/lib/business/datetime-timezone";
import { zonedDateTimeToUtc } from "@/lib/business/activity-timestamp";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { DEACTIVATION_TABLE } from "@/lib/domain/deactivation-tables";
import type { Db } from "@/lib/db/client";
import { getDb } from "@/lib/db/client";
import { applyActivityIncomeDelta } from "@/lib/repos/activity-credits";
import { archiveRecords } from "@/lib/repos/deactivation-reasons";
import { runTaskSubTaskSyncRoutine } from "@/lib/repos/subtask-lifecycle";
import type { AdminActivityFormInput } from "@/lib/schemas/admin-activity";
import type { ActivityListFilters } from "@/lib/schemas/activity-list-filters";
import type { ActivityListSort } from "@/lib/schemas/activity-list-sort";

export type ActivityListItem = {
  id: string;
  action: "started" | "stoped";
  timestamp: Date;
  qty: number;
  active: boolean;
  currencyAwarded: number;
  colaboratorId: string;
  colaboratorName: string;
  colaboratorCode: number | null;
  subTaskId: string;
  subTaskName: string;
  taskName: string;
};

export type ActivityFormOptions = {
  colaborators: Array<{
    id: string;
    name: string;
    code: number | null;
  }>;
  subTasks: Array<{
    id: string;
    name: string;
    taskName: string;
  }>;
};

const LOCAL_ACTIVITY_DATE = sql<string>`
  (${activities.timestamp} AT TIME ZONE ${DEFAULT_TIME_ZONE})::date
`;

function activityListWhere(options: {
  q?: string;
  showArchived?: boolean;
  actions: ActivityListFilters["actions"];
  from: string;
  to: string;
}) {
  const activeClause = eq(activities.active, !options.showArchived);
  const actionClause = inArray(activities.action, options.actions);
  const dateClause = and(
    gte(LOCAL_ACTIVITY_DATE, options.from),
    lte(LOCAL_ACTIVITY_DATE, options.to),
  );
  const q = options.q?.trim();
  const searchClause = q
    ? or(
        ilike(users.name, `%${q}%`),
        sql`${users.code}::text ILIKE ${"%" + q + "%"}`,
        ilike(subTasks.name, `%${q}%`),
        ilike(tasks.name, `%${q}%`),
      )
    : undefined;
  return and(activeClause, actionClause, dateClause, searchClause);
}

function activityListOrderBy(sort: ActivityListSort) {
  const dir = sort.direction === "desc" ? desc : asc;
  const tieBreakers = [desc(activities.timestamp), asc(activities.id)] as const;

  switch (sort.column) {
    case "action":
      return [dir(activities.action), ...tieBreakers];
    case "colaborator":
      return [dir(users.name), dir(users.code), ...tieBreakers];
    case "qty":
      return [dir(activities.qty), ...tieBreakers];
    case "subtask":
      return [dir(subTasks.name), dir(tasks.name), ...tieBreakers];
    case "timestamp":
    default:
      return [dir(activities.timestamp), asc(activities.id)];
  }
}

function mapListRow(row: {
  id: string;
  action: "started" | "stoped";
  timestamp: Date;
  qty: number;
  active: boolean;
  currencyAwarded: number;
  colaboratorId: string;
  colaboratorName: string;
  colaboratorCode: number | null;
  subTaskId: string;
  subTaskName: string;
  taskName: string;
}): ActivityListItem {
  return {
    id: row.id,
    action: row.action,
    timestamp: row.timestamp,
    qty: row.qty,
    active: row.active,
    currencyAwarded: row.currencyAwarded,
    colaboratorId: row.colaboratorId,
    colaboratorName: row.colaboratorName,
    colaboratorCode: row.colaboratorCode,
    subTaskId: row.subTaskId,
    subTaskName: row.subTaskName,
    taskName: row.taskName,
  };
}

const LIST_COLUMNS = {
  id: activities.id,
  action: activities.action,
  timestamp: activities.timestamp,
  qty: activities.qty,
  active: activities.active,
  currencyAwarded: activities.currencyAwarded,
  colaboratorId: activities.colaboratorId,
  colaboratorName: users.name,
  colaboratorCode: users.code,
  subTaskId: activities.subTaskId,
  subTaskName: subTasks.name,
  taskName: tasks.name,
} as const;

function activityListQuery(db: Db) {
  return db
    .select(LIST_COLUMNS)
    .from(activities)
    .innerJoin(users, eq(activities.colaboratorId, users.id))
    .innerJoin(subTasks, eq(activities.subTaskId, subTasks.id))
    .innerJoin(tasks, eq(subTasks.taskId, tasks.id));
}

export async function listActivitiesPaged(
  options: {
    q?: string;
    page?: number;
    pageSize?: number;
    sort?: ActivityListSort;
    showArchived?: boolean;
    actions: ActivityListFilters["actions"];
    from: string;
    to: string;
  },
  db: Db = getDb(),
): Promise<{ items: ActivityListItem[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 1);
  const offset = (page - 1) * pageSize;
  const where = activityListWhere(options);
  const sort = options.sort ?? {
    column: "timestamp" as const,
    direction: "desc" as const,
  };

  const [totalRow] = await db
    .select({ total: count() })
    .from(activities)
    .innerJoin(users, eq(activities.colaboratorId, users.id))
    .innerJoin(subTasks, eq(activities.subTaskId, subTasks.id))
    .innerJoin(tasks, eq(subTasks.taskId, tasks.id))
    .where(where);

  const rows = await activityListQuery(db)
    .where(where)
    .orderBy(...activityListOrderBy(sort))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map(mapListRow),
    total: totalRow?.total ?? 0,
  };
}

export async function getActivityById(
  id: string,
  db: Db = getDb(),
): Promise<ActivityListItem | null> {
  const [row] = await activityListQuery(db)
    .where(eq(activities.id, id))
    .limit(1);
  return row ? mapListRow(row) : null;
}

export async function listActivityFormOptions(
  db: Db = getDb(),
): Promise<ActivityFormOptions> {
  const [colaborators, subTaskRows] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        code: users.code,
      })
      .from(users)
      .where(eq(users.active, true))
      .orderBy(asc(users.name), asc(users.code)),
    db
      .select({
        id: subTasks.id,
        name: subTasks.name,
        taskName: tasks.name,
      })
      .from(subTasks)
      .innerJoin(tasks, eq(subTasks.taskId, tasks.id))
      .where(and(eq(subTasks.active, true), eq(tasks.active, true)))
      .orderBy(asc(tasks.name), asc(subTasks.name)),
  ]);

  return { colaborators, subTasks: subTaskRows };
}

async function paymentCurrencyPluralTitle(db: Db): Promise<string | null> {
  const [setting] = await db.select().from(currencyForSubtasks).limit(1);
  if (!setting) return null;
  const [currency] = await db
    .select()
    .from(currencies)
    .where(eq(currencies.id, setting.currencyId))
    .limit(1);
  if (!currency) return null;
  return resolveCurrencyPluralTitle(currency);
}

function timestampFromForm(input: AdminActivityFormInput): Date {
  const timestamp = zonedDateTimeToUtc(input.date, input.time);
  if (!timestamp) throw new Error("invalidTimestamp");
  return timestamp;
}

async function refreshAffectedTasks(
  subTaskIds: readonly string[],
  db: Db,
): Promise<void> {
  if (subTaskIds.length === 0) return;
  const rows = await db
    .select({ taskId: subTasks.taskId })
    .from(subTasks)
    .where(inArray(subTasks.id, [...subTaskIds]));
  const taskIds = [...new Set(rows.map((row) => row.taskId))];
  const now = new Date();
  await db
    .update(subTasks)
    .set({ updatedAt: now })
    .where(inArray(subTasks.id, [...subTaskIds]));
  for (const taskId of taskIds) {
    await runTaskSubTaskSyncRoutine(taskId, db, now);
  }
}

export async function createActivity(
  input: AdminActivityFormInput,
  db: Db = getDb(),
): Promise<ActivityListItem> {
  const timestamp = timestampFromForm(input);
  const [created] = await db
    .insert(activities)
    .values({
      subTaskId: input.subTaskId,
      colaboratorId: input.colaboratorId,
      action: input.action,
      timestamp,
      qty: input.qty,
      currencyAwarded: 0,
      chainRunId: null,
      active: true,
    })
    .returning({ id: activities.id });
  await refreshAffectedTasks([input.subTaskId], db);
  const row = await getActivityById(created.id, db);
  if (!row) throw new Error("activityNotFound");
  return row;
}

export async function updateActivityFields(
  id: string,
  input: AdminActivityFormInput,
  db: Db = getDb(),
): Promise<void> {
  const existing = await getActivityById(id, db);
  if (!existing) throw new Error("activityNotFound");
  const timestamp = timestampFromForm(input);
  await db
    .update(activities)
    .set({
      subTaskId: input.subTaskId,
      colaboratorId: input.colaboratorId,
      action: input.action,
      timestamp,
      qty: input.qty,
    })
    .where(eq(activities.id, id));
  await refreshAffectedTasks(
    [...new Set([existing.subTaskId, input.subTaskId])],
    db,
  );
}

async function reverseAwardedIncome(
  rows: Array<{
    colaboratorId: string;
    timestamp: Date;
    currencyAwarded: number;
  }>,
  sign: 1 | -1,
  db: Db,
): Promise<void> {
  const awarded = rows.filter((row) => row.currencyAwarded !== 0);
  if (awarded.length === 0) return;
  const plural = await paymentCurrencyPluralTitle(db);
  for (const row of awarded) {
    await applyActivityIncomeDelta(
      {
        colaboratorId: row.colaboratorId,
        timestamp: row.timestamp,
        delta: sign * row.currencyAwarded,
        currencyPluralTitle: plural,
      },
      db,
    );
  }
}

export async function archiveActivities(
  ids: string[],
  reason: string,
  db: Db = getDb(),
): Promise<void> {
  await archiveRecords(
    {
      tableName: DEACTIVATION_TABLE.activities,
      recordIds: ids,
      text: reason,
      setInactive: async (recordIds, tx) => {
        const rows = await tx
          .select({
            subTaskId: activities.subTaskId,
            colaboratorId: activities.colaboratorId,
            timestamp: activities.timestamp,
            currencyAwarded: activities.currencyAwarded,
          })
          .from(activities)
          .where(
            and(inArray(activities.id, recordIds), eq(activities.active, true)),
          );
        if (rows.length !== recordIds.length) {
          throw new Error("activityNotFound");
        }
        await reverseAwardedIncome(rows, -1, tx);
        await tx
          .update(activities)
          .set({ active: false })
          .where(inArray(activities.id, recordIds));
        await refreshAffectedTasks(
          rows.map((row) => row.subTaskId),
          tx,
        );
      },
    },
    db,
  );
}

export async function reactivateActivity(
  id: string,
  db: Db = getDb(),
): Promise<void> {
  await db.transaction(async (tx) => {
    const txDb = tx as unknown as Db;
    const [row] = await txDb
      .select({
        subTaskId: activities.subTaskId,
        colaboratorId: activities.colaboratorId,
        timestamp: activities.timestamp,
        currencyAwarded: activities.currencyAwarded,
        active: activities.active,
      })
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);
    if (!row) throw new Error("activityNotFound");
    if (row.active) return;

    await txDb
      .update(activities)
      .set({ active: true })
      .where(eq(activities.id, id));
    await reverseAwardedIncome([row], 1, txDb);
    await refreshAffectedTasks([row.subTaskId], txDb);
  });
}

export async function deleteActivityById(
  id: string,
  db: Db = getDb(),
): Promise<void> {
  const [row] = await db
    .select({
      subTaskId: activities.subTaskId,
      active: activities.active,
    })
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1);
  if (!row) throw new Error("activityNotFound");
  if (row.active) throw new Error("activeActivity");
  await db.delete(activities).where(eq(activities.id, id));
  await refreshAffectedTasks([row.subTaskId], db);
}
