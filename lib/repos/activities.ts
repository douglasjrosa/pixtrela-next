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
  subTasks,
  tasks,
  users,
} from "@/drizzle/schema";
import { DEFAULT_TIME_ZONE } from "@/lib/business/datetime-timezone";
import { zonedDateTimeToUtc } from "@/lib/business/activity-timestamp";
import { DEACTIVATION_TABLE } from "@/lib/domain/deactivation-tables";
import type { Db } from "@/lib/db/client";
import { getDb } from "@/lib/db/client";
import { archiveRecords } from "@/lib/repos/deactivation-reasons";
import {
  loadActiveCreditSnapshots,
  recomputeActivityCreditsAfterAdminChange,
  type ActivityCreditSnapshot,
} from "@/lib/repos/recompute-activity-credits";
import { runTaskSubTaskSyncRoutine } from "@/lib/repos/subtask-lifecycle";
import type { AdminActivityFormInput } from "@/lib/schemas/admin-activity";
import type { ActivityListFilters } from "@/lib/schemas/activity-list-filters";
import {
  ACTIVITY_SUBTASK_PICKER_MIN_QUERY_LENGTH,
  ACTIVITY_SUBTASK_PICKER_RESULT_LIMIT,
} from "@/lib/activities/activity-subtask-picker-search";
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
  taskQty: number;
  taskCrmItemKey: string | null;
  taskDeliveryDate: string | null;
};

export type ActivitySubtaskPickerRow = {
  id: string;
  name: string;
  taskName: string;
  taskQty: number;
  taskCrmItemKey: string | null;
  taskDeliveryDate: string | null;
};

export type ActivityFormOptions = {
  colaborators: Array<{
    id: string;
    name: string;
    code: number | null;
  }>;
};

function activitySubtaskPickerSearchClause(q: string) {
  const pattern = `%${q}%`;
  return or(
    ilike(subTasks.name, pattern),
    ilike(tasks.name, pattern),
    ilike(tasks.crmItemKey, pattern),
    sql`replace(${tasks.crmItemKey}, ':', '-') ILIKE ${pattern}`,
    sql`${tasks.qty}::text ILIKE ${pattern}`,
    sql`to_char(${tasks.deliveryDate}, 'DD/MM/YYYY') ILIKE ${pattern}`,
  );
}

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
        ilike(tasks.crmItemKey, `%${q}%`),
        sql`${tasks.qty}::text ILIKE ${"%" + q + "%"}`,
        sql`to_char(${tasks.deliveryDate}, 'DD/MM/YYYY') ILIKE ${"%" + q + "%"}`,
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
  taskQty: number;
  taskCrmItemKey: string | null;
  taskDeliveryDate: string | null;
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
    taskQty: row.taskQty,
    taskCrmItemKey: row.taskCrmItemKey,
    taskDeliveryDate: row.taskDeliveryDate,
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
  taskQty: tasks.qty,
  taskCrmItemKey: tasks.crmItemKey,
  taskDeliveryDate: tasks.deliveryDate,
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
  const colaborators = await db
    .select({
      id: users.id,
      name: users.name,
      code: users.code,
    })
    .from(users)
    .where(eq(users.active, true))
    .orderBy(asc(users.name), asc(users.code));

  return { colaborators };
}

export async function searchActivitySubtaskPickerOptions(
  rawQuery: string,
  db: Db = getDb(),
): Promise<ActivitySubtaskPickerRow[]> {
  const q = rawQuery.trim();
  if (q.length < ACTIVITY_SUBTASK_PICKER_MIN_QUERY_LENGTH) {
    return [];
  }

  return db
    .select({
      id: subTasks.id,
      name: subTasks.name,
      taskName: tasks.name,
      taskQty: tasks.qty,
      taskCrmItemKey: tasks.crmItemKey,
      taskDeliveryDate: tasks.deliveryDate,
    })
    .from(subTasks)
    .innerJoin(tasks, eq(subTasks.taskId, tasks.id))
    .where(
      and(
        eq(subTasks.active, true),
        eq(tasks.active, true),
        activitySubtaskPickerSearchClause(q),
      ),
    )
    .orderBy(asc(tasks.name), asc(subTasks.name))
    .limit(ACTIVITY_SUBTASK_PICKER_RESULT_LIMIT);
}

async function loadActivityScopeRow(
  id: string,
  db: Db,
): Promise<{
  subTaskId: string;
  chainRunId: string | null;
  active: boolean;
} | null> {
  const [row] = await db
    .select({
      subTaskId: activities.subTaskId,
      chainRunId: activities.chainRunId,
      active: activities.active,
    })
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1);
  return row ?? null;
}

async function replayActivityCredits(
  scope: {
    subTaskIds: Array<string | null | undefined>;
    chainRunIds: Array<string | null | undefined>;
    previous: ActivityCreditSnapshot[];
  },
  db: Db,
): Promise<void> {
  await recomputeActivityCreditsAfterAdminChange(scope, db);
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
  const previous = await loadActiveCreditSnapshots(
    { subTaskIds: [input.subTaskId], chainRunIds: [] },
    db,
  );
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
  await replayActivityCredits(
    {
      subTaskIds: [input.subTaskId],
      chainRunIds: [],
      previous,
    },
    db,
  );
  const row = await getActivityById(created.id, db);
  if (!row) throw new Error("activityNotFound");
  return row;
}

export async function updateActivityFields(
  id: string,
  input: AdminActivityFormInput,
  db: Db = getDb(),
): Promise<void> {
  const existing = await loadActivityScopeRow(id, db);
  if (!existing) throw new Error("activityNotFound");
  const previous = await loadActiveCreditSnapshots(
    {
      subTaskIds: [existing.subTaskId, input.subTaskId],
      chainRunIds: [existing.chainRunId],
    },
    db,
  );
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
  await replayActivityCredits(
    {
      subTaskIds: [existing.subTaskId, input.subTaskId],
      chainRunIds: [existing.chainRunId],
      previous,
    },
    db,
  );
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
            chainRunId: activities.chainRunId,
          })
          .from(activities)
          .where(
            and(inArray(activities.id, recordIds), eq(activities.active, true)),
          );
        if (rows.length !== recordIds.length) {
          throw new Error("activityNotFound");
        }
        const previous = await loadActiveCreditSnapshots(
          {
            subTaskIds: rows.map((row) => row.subTaskId),
            chainRunIds: rows.map((row) => row.chainRunId),
          },
          tx,
        );
        await tx
          .update(activities)
          .set({ active: false })
          .where(inArray(activities.id, recordIds));
        await refreshAffectedTasks(
          rows.map((row) => row.subTaskId),
          tx,
        );
        await replayActivityCredits(
          {
            subTaskIds: rows.map((row) => row.subTaskId),
            chainRunIds: rows.map((row) => row.chainRunId),
            previous,
          },
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
    const row = await loadActivityScopeRow(id, txDb);
    if (!row) throw new Error("activityNotFound");
    if (row.active) return;
    const previous = await loadActiveCreditSnapshots(
      {
        subTaskIds: [row.subTaskId],
        chainRunIds: [row.chainRunId],
      },
      txDb,
    );

    await txDb
      .update(activities)
      .set({ active: true })
      .where(eq(activities.id, id));
    await refreshAffectedTasks([row.subTaskId], txDb);
    await replayActivityCredits(
      {
        subTaskIds: [row.subTaskId],
        chainRunIds: [row.chainRunId],
        previous,
      },
      txDb,
    );
  });
}

export async function deleteActivityById(
  id: string,
  db: Db = getDb(),
): Promise<void> {
  const row = await loadActivityScopeRow(id, db);
  if (!row) throw new Error("activityNotFound");
  if (row.active) throw new Error("activeActivity");
  const previous = await loadActiveCreditSnapshots(
    {
      subTaskIds: [row.subTaskId],
      chainRunIds: [row.chainRunId],
    },
    db,
  );
  await db.delete(activities).where(eq(activities.id, id));
  await refreshAffectedTasks([row.subTaskId], db);
  await replayActivityCredits(
    {
      subTaskIds: [row.subTaskId],
      chainRunIds: [row.chainRunId],
      previous,
    },
    db,
  );
}
