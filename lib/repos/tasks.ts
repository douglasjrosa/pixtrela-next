import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, max, or, sql, type InferSelectModel } from "drizzle-orm";

import {
  activities,
  subTaskAssignees,
  subTaskDependencies,
  subTasks,
  tasks,
  templateSubTasks,
  templateTasks,
  users,
} from "@/drizzle/schema";
import { toDrizzleActivationStatus } from "@/lib/domain/subtask-activation-map";
import {
  listActivitySessions,
  type ActivitySession,
} from "@/lib/business/task-progress";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import {
  rescaleExpectedTimeForTaskQtyChange,
  rescaleQtyForTaskQtyChange,
  scaleTemplateSubTaskForTask,
} from "@/lib/domain/work-currency";
import { getDb, type Db } from "@/lib/db/client";
import { DEACTIVATION_TABLE } from "@/lib/domain/deactivation-tables";
import type { TasksRevision } from "@/lib/tasks/tasks-revision";
import { archiveRecords } from "@/lib/repos/deactivation-reasons";
import { recordActivityViaKiosk, reconcileProducingStatusFromOpenSessions } from "@/lib/repos/kiosk-subtasks";
import { listAssignedFlagsForSubTasks } from "@/lib/repos/material-flags";
import { formatMaterialFlagCode } from "@/lib/business/material-flag-code";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import type { TaskListSort } from "@/lib/schemas/task-list-sort";
import { runTaskSubTaskSyncRoutine } from "@/lib/repos/subtask-lifecycle";
import {
  selectBoardColumnPage,
  type BoardColumnPageCursor,
} from "@/lib/board/column-task-page";
import type { StepTaskOrderBy } from "@/lib/schemas/step-task-order-by";

export type CreateTaskInput = {
  name: string;
  qty?: number;
  deliveryDate?: string | null;
  stepId?: string | null;
  status?: "waiting" | "producing" | "paused" | "finished" | "reviewed" | "delivered";
  templateTaskCode?: string | null;
  index?: number;
  crmPedidoId?: number | null;
  crmItemKey?: string | null;
};

export type CreateTaskDebugStage = {
  stage: string;
  ms: number;
  detail?: string;
};

export type CreateTaskInstrumentation = {
  trace: CreateTaskDebugStage[];
  rootStartedAt: number;
};

function pushCreateTaskStage(
  instrumentation: CreateTaskInstrumentation | undefined,
  stageStartedAt: number,
  stage: string,
  detail?: string,
): void {
  if (!instrumentation) return;
  instrumentation.trace.push({
    stage,
    ms: Date.now() - stageStartedAt,
    detail,
  });
}

export async function createTask(
  input: CreateTaskInput,
  db?: Db,
  instrumentation?: CreateTaskInstrumentation,
) {
  const resolvedDb = db ?? getDb();
  return resolvedDb.transaction(async (tx) => {
    const qty = Math.max(1, input.qty ?? 1);
    const [task] = await tx
      .insert(tasks)
      .values({
        name: input.name.trim(),
        qty,
        deliveryDate: input.deliveryDate ?? null,
        stepId: input.stepId ?? null,
        status: input.status ?? "waiting",
        templateTaskCode: input.templateTaskCode ?? null,
        index: input.index ?? 0,
        crmPedidoId: input.crmPedidoId ?? null,
        crmItemKey: input.crmItemKey ?? null,
      })
      .returning();

    const code = input.templateTaskCode?.trim();
    if (code) {
      const [template] = await tx
        .select()
        .from(templateTasks)
        .where(eq(templateTasks.code, code))
        .limit(1);

      if (template) {
        const templateRows = await tx
          .select()
          .from(templateSubTasks)
          .where(eq(templateSubTasks.templateTaskId, template.id))
          .orderBy(asc(templateSubTasks.index));

        const createdByIndex = new Map<number, string>();
        let totalExpected = 0;
        const subTaskInsertStartedAt = Date.now();
        const subTaskValues = templateRows.map((row) => {
          const scaled = scaleTemplateSubTaskForTask({
            templateQty: row.qty,
            templateExpectedTime: row.expectedTime,
            taskQty: qty,
          });
          totalExpected += scaled.expectedTime;
          return {
            taskId: task.id,
            name: row.name,
            qty: scaled.qty,
            index: row.index,
            expectedTime: scaled.expectedTime,
            sharingType: row.sharingType,
            maxSameTimeWorkers: row.maxSameTimeWorkers,
            linkedToPrevious: row.linkedToPrevious,
            subTaskCategoryId: row.subTaskCategoryId,
          };
        });

        if (subTaskValues.length > 0) {
          const createdRows = await tx
            .insert(subTasks)
            .values(subTaskValues)
            .returning({ id: subTasks.id, index: subTasks.index });
          for (const created of createdRows) {
            createdByIndex.set(created.index, created.id);
          }
        }
        pushCreateTaskStage(
          instrumentation,
          subTaskInsertStartedAt,
          "create_task_insert_subtasks",
          `count=${subTaskValues.length}`,
        );

        const depInsertStartedAt = Date.now();
        const dependencyValues: Array<{
          subTaskId: string;
          dependsOnSubTaskId: string;
        }> = [];
        for (const row of templateRows) {
          const subId = createdByIndex.get(row.index);
          if (!subId) continue;
          for (const depIndex of row.dependencyIndexes ?? []) {
            const depId = createdByIndex.get(depIndex);
            if (!depId) continue;
            dependencyValues.push({
              subTaskId: subId,
              dependsOnSubTaskId: depId,
            });
          }
        }
        if (dependencyValues.length > 0) {
          await tx.insert(subTaskDependencies).values(dependencyValues);
        }
        pushCreateTaskStage(
          instrumentation,
          depInsertStartedAt,
          "create_task_insert_dependencies",
          `count=${dependencyValues.length}`,
        );

        await tx
          .update(tasks)
          .set({ totalExpectedTime: totalExpected, updatedAt: new Date() })
          .where(eq(tasks.id, task.id));

        const syncStartedAt = Date.now();
        await runTaskSubTaskSyncRoutine(
          task.id,
          tx as unknown as Db,
        );
        pushCreateTaskStage(
          instrumentation,
          syncStartedAt,
          "create_task_sync_routine",
          `subtasks=${templateRows.length}`,
        );
      }
    }

    const [fresh] = await tx
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .limit(1);
    return fresh;
  });
}

export async function listTasks(db: Db = getDb()) {
  return db.select().from(tasks).orderBy(asc(tasks.deliveryDate), asc(tasks.name));
}

/** Subtasks counted for list progress (DB enum `blocked` = domain `disabled`). */
const COUNTED_SUBTASK_SQL = sql`${subTasks.activationStatus} is distinct from 'blocked'`;

const FINISHED_SUBTASK_COUNT_EXPR = sql<number>`
  coalesce(
    count(${subTasks.id}) filter (
      where ${COUNTED_SUBTASK_SQL} and ${subTasks.status} = 'finished'
    ),
    0
  )
`;

const TOTAL_SUBTASK_COUNT_EXPR = sql<number>`
  coalesce(count(${subTasks.id}) filter (where ${COUNTED_SUBTASK_SQL}), 0)
`;

const STATUS_SORT_EXPR = sql<number>`
  case ${tasks.status}
    when 'waiting' then 0
    when 'producing' then 1
    when 'paused' then 2
    when 'finished' then 3
    when 'reviewed' then 4
    when 'delivered' then 5
    else 6
  end
`;

const CRM_ITEM_KEY_PEDIDO_EXPR = sql<number | null>`
  case
    when ${tasks.crmItemKey} ~ '^[0-9]+:[0-9]+$'
    then split_part(${tasks.crmItemKey}, ':', 1)::bigint
    else null
  end
`;

const CRM_ITEM_KEY_ITEM_EXPR = sql<number | null>`
  case
    when ${tasks.crmItemKey} ~ '^[0-9]+:[0-9]+$'
    then split_part(${tasks.crmItemKey}, ':', 2)::bigint
    else null
  end
`;

export type TaskListItem = {
  id: string;
  name: string;
  qty: number;
  deliveryDate: string | null;
  status: InferSelectModel<typeof tasks>["status"];
  active: boolean;
  crmItemKey: string | null;
  totalTimeSpent: number;
  totalExpectedTime: number;
  finishedSubTaskCount: number;
  totalSubTaskCount: number;
};

function taskListWhere(options: {
  q?: string;
  showArchived?: boolean;
  statuses: TaskListFilters["statuses"];
  from: string;
  to: string;
}) {
  const activeClause = eq(tasks.active, !options.showArchived);
  const statusClause = inArray(tasks.status, options.statuses);
  const deliveryClause = and(
    or(isNull(tasks.deliveryDate), gte(tasks.deliveryDate, options.from)),
    or(isNull(tasks.deliveryDate), lte(tasks.deliveryDate, options.to)),
  );
  const q = options.q?.trim();
  const searchClause = q
    ? or(ilike(tasks.name, `%${q}%`), ilike(tasks.crmItemKey, `%${q}%`))
    : undefined;
  return and(activeClause, statusClause, deliveryClause, searchClause);
}

function taskListOrderBy(sort: TaskListSort) {
  const dir = sort.direction === "desc" ? desc : asc;
  const tieBreakers = [asc(tasks.name), asc(tasks.id)] as const;

  switch (sort.column) {
    case "crmItemKey":
      return [
        dir(CRM_ITEM_KEY_PEDIDO_EXPR),
        dir(CRM_ITEM_KEY_ITEM_EXPR),
        ...tieBreakers,
      ];
    case "name":
      return [dir(tasks.name), asc(tasks.id)];
    case "qty":
      return [dir(tasks.qty), ...tieBreakers];
    case "deliveryDate":
      return [dir(tasks.deliveryDate), ...tieBreakers];
    case "totalTimeSpent":
      return [dir(tasks.totalTimeSpent), ...tieBreakers];
    case "finishedSubTasks":
      return [
        dir(FINISHED_SUBTASK_COUNT_EXPR),
        dir(TOTAL_SUBTASK_COUNT_EXPR),
        ...tieBreakers,
      ];
    case "status":
      return [dir(STATUS_SORT_EXPR), ...tieBreakers];
    default:
      return [asc(tasks.deliveryDate), ...tieBreakers];
  }
}

/**
 * SQL-paged task list with only columns the /tasks page needs, plus
 * aggregated subtask completion counts.
 */
export async function listTasksPaged(
  options: {
    q?: string;
    page?: number;
    pageSize?: number;
    sort?: TaskListSort;
    showArchived?: boolean;
    statuses: TaskListFilters["statuses"];
    from: string;
    to: string;
  },
  db: Db = getDb(),
): Promise<{ items: TaskListItem[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const offset = (page - 1) * pageSize;
  const where = taskListWhere(options);
  const sort = options.sort ?? {
    column: "deliveryDate" as const,
    direction: "asc" as const,
  };

  const [totalRow] = await db
    .select({ total: count() })
    .from(tasks)
    .where(where);

  const rows = await db
    .select({
      id: tasks.id,
      name: tasks.name,
      qty: tasks.qty,
      deliveryDate: tasks.deliveryDate,
      status: tasks.status,
      active: tasks.active,
      crmItemKey: tasks.crmItemKey,
      totalTimeSpent: tasks.totalTimeSpent,
      totalExpectedTime: tasks.totalExpectedTime,
      finishedSubTaskCount: FINISHED_SUBTASK_COUNT_EXPR,
      totalSubTaskCount: TOTAL_SUBTASK_COUNT_EXPR,
    })
    .from(tasks)
    .leftJoin(subTasks, eq(subTasks.taskId, tasks.id))
    .where(where)
    .groupBy(
      tasks.id,
      tasks.name,
      tasks.qty,
      tasks.deliveryDate,
      tasks.status,
      tasks.active,
      tasks.crmItemKey,
      tasks.totalTimeSpent,
      tasks.totalExpectedTime,
    )
    .orderBy(...taskListOrderBy(sort))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      qty: row.qty,
      deliveryDate: row.deliveryDate,
      status: row.status,
      active: row.active,
      crmItemKey: row.crmItemKey,
      totalTimeSpent: row.totalTimeSpent,
      totalExpectedTime: row.totalExpectedTime,
      finishedSubTaskCount: Number(row.finishedSubTaskCount),
      totalSubTaskCount: Number(row.totalSubTaskCount),
    })),
    total: totalRow?.total ?? 0,
  };
}

const E2E_TASK_DEACTIVATION_REASON =
  "E2E cleanup: deactivate duplicate create-task fixture so the manager " +
  "create flow can run repeatedly without leaving active clones.";

export async function deactivateActiveTasksByName(
  name: string,
  reason: string = E2E_TASK_DEACTIVATION_REASON,
  db: Db = getDb(),
): Promise<number> {
  const active = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.name, name), eq(tasks.active, true)));
  if (active.length === 0) return 0;

  await archiveTasks(
    active.map((row) => row.id),
    reason,
    db,
  );
  return active.length;
}

export async function listSubTasksForTask(taskId: string, db: Db = getDb()) {
  return listSubTasksForTasks([taskId], db);
}

export async function listSubTasksForTasks(
  taskIds: readonly string[],
  db: Db = getDb(),
) {
  if (taskIds.length === 0) return [];
  return db
    .select()
    .from(subTasks)
    .where(inArray(subTasks.taskId, [...taskIds]))
    .orderBy(asc(subTasks.index));
}

const BOARD_SUBTASK_COLUMNS = {
  id: subTasks.id,
  taskId: subTasks.taskId,
  name: subTasks.name,
  status: subTasks.status,
  sharingType: subTasks.sharingType,
  qty: subTasks.qty,
  index: subTasks.index,
  expectedTime: subTasks.expectedTime,
  timeSpent: subTasks.timeSpent,
  maxSameTimeWorkers: subTasks.maxSameTimeWorkers,
  linkedToPrevious: subTasks.linkedToPrevious,
} as const;

export type BoardSubtaskRow = Pick<
  InferSelectModel<typeof subTasks>,
  keyof typeof BOARD_SUBTASK_COLUMNS
>;

export type BoardSubtaskAssigneeRow = {
  subTaskId: string;
  userId: string;
  name: string;
};

export type BoardSubtaskActivityRow = {
  subTaskId: string;
  colaboratorId: string;
  colaboratorName: string;
  action: "started" | "stoped";
  timestamp: Date;
  qty: number;
};

export async function listBoardSubTasksForTask(
  taskId: string,
  db: Db = getDb(),
): Promise<BoardSubtaskRow[]> {
  return db
    .select(BOARD_SUBTASK_COLUMNS)
    .from(subTasks)
    .where(eq(subTasks.taskId, taskId))
    .orderBy(asc(subTasks.index));
}

export async function listBoardSubtaskAssignees(
  subTaskIds: readonly string[],
  db: Db = getDb(),
): Promise<BoardSubtaskAssigneeRow[]> {
  if (subTaskIds.length === 0) return [];
  return db
    .select({
      subTaskId: subTaskAssignees.subTaskId,
      userId: subTaskAssignees.userId,
      name: users.name,
    })
    .from(subTaskAssignees)
    .innerJoin(users, eq(subTaskAssignees.userId, users.id))
    .where(inArray(subTaskAssignees.subTaskId, [...subTaskIds]));
}

export async function listBoardSubtaskOpenActivities(
  subTaskIds: readonly string[],
  db: Db = getDb(),
): Promise<BoardSubtaskActivityRow[]> {
  if (subTaskIds.length === 0) return [];

  const latestRows = await db
    .selectDistinctOn(
      [activities.subTaskId, activities.colaboratorId],
      {
        subTaskId: activities.subTaskId,
        colaboratorId: activities.colaboratorId,
        colaboratorName: users.name,
        action: activities.action,
        timestamp: activities.timestamp,
        qty: activities.qty,
      },
    )
    .from(activities)
    .innerJoin(users, eq(activities.colaboratorId, users.id))
    .where(
      and(
        inArray(activities.subTaskId, [...subTaskIds]),
        inArray(activities.action, ["started", "stoped"]),
      ),
    )
    .orderBy(
      activities.subTaskId,
      activities.colaboratorId,
      desc(activities.timestamp),
    );

  return latestRows
    .filter((row) => row.action === "started")
    .map((row) => ({
      subTaskId: row.subTaskId,
      colaboratorId: row.colaboratorId,
      colaboratorName: row.colaboratorName ?? "",
      action: row.action,
      timestamp: row.timestamp,
      qty: Number(row.qty ?? 0),
    }));
}

export async function listBoardSubtaskSessionHistory(
  subTaskIds: readonly string[],
  db: Db = getDb(),
): Promise<BoardSubtaskActivityRow[]> {
  if (subTaskIds.length === 0) return [];

  const activityRows = await db
    .select({
      subTaskId: activities.subTaskId,
      colaboratorId: activities.colaboratorId,
      colaboratorName: users.name,
      action: activities.action,
      timestamp: activities.timestamp,
      qty: activities.qty,
    })
    .from(activities)
    .innerJoin(users, eq(activities.colaboratorId, users.id))
    .where(
      and(
        inArray(activities.subTaskId, [...subTaskIds]),
        inArray(activities.action, ["started", "stoped"]),
      ),
    )
    .orderBy(asc(activities.timestamp));

  return activityRows
    .filter((row) => row.timestamp != null)
    .map((row) => ({
      subTaskId: row.subTaskId,
      colaboratorId: row.colaboratorId,
      colaboratorName: row.colaboratorName ?? "",
      action: row.action,
      timestamp: row.timestamp,
      qty: Number(row.qty ?? 0),
    }));
}

function toActivitySessionRefs(
  rows: readonly BoardSubtaskActivityRow[],
): import("@/lib/business/task-progress").ActivitySessionRef[] {
  return rows.map((row) => ({
    subTaskDocumentId: row.subTaskId,
    colaboratorDocumentId: row.colaboratorId,
    colaboratorName: row.colaboratorName,
    action: row.action,
    timestamp: row.timestamp.toISOString(),
    qty: row.qty,
  }));
}

export function mapBoardSubtaskSessionHistory(
  rows: readonly BoardSubtaskActivityRow[],
): Record<string, ActivitySession[]> {
  const bySubTask = new Map<string, BoardSubtaskActivityRow[]>();
  for (const row of rows) {
    const list = bySubTask.get(row.subTaskId) ?? [];
    list.push(row);
    bySubTask.set(row.subTaskId, list);
  }

  const sessionsBySubTask: Record<string, ActivitySession[]> = {};
  for (const [subTaskId, subTaskRows] of bySubTask) {
    sessionsBySubTask[subTaskId] = listActivitySessions(
      toActivitySessionRefs(subTaskRows),
    );
  }
  return sessionsBySubTask;
}

export type BoardSubtaskCoreBundle = {
  rows: BoardSubtaskRow[];
  assigneeRows: BoardSubtaskAssigneeRow[];
  flagRows: { subTaskId: string; code: string }[];
  dependencyRows: { consumerId: string; producerId: string }[];
};

export async function listBoardSubtaskCore(
  taskId: string,
  db: Db = getDb(),
): Promise<BoardSubtaskCoreBundle> {
  const rows = await listBoardSubTasksForTask(taskId, db);
  if (rows.length === 0) {
    return { rows: [], assigneeRows: [], flagRows: [], dependencyRows: [] };
  }

  const ids = rows.map((row) => row.id);
  const [assigneeRows, assignedFlags, dependencyRows, openActivities] =
    await Promise.all([
    listBoardSubtaskAssignees(ids, db),
    listAssignedFlagsForSubTasks(ids, db),
    db
      .select({
        consumerId: subTaskDependencies.subTaskId,
        producerId: subTaskDependencies.dependsOnSubTaskId,
      })
      .from(subTaskDependencies)
      .where(inArray(subTaskDependencies.subTaskId, ids)),
    listBoardSubtaskOpenActivities(ids, db),
  ]);

  const activeColaboratorIdsBySubTaskId = new Map<string, string[]>();
  for (const activity of openActivities) {
    const list = activeColaboratorIdsBySubTaskId.get(activity.subTaskId) ?? [];
    list.push(activity.colaboratorId);
    activeColaboratorIdsBySubTaskId.set(activity.subTaskId, list);
  }
  await reconcileProducingStatusFromOpenSessions(
    rows,
    activeColaboratorIdsBySubTaskId,
    db,
  );

  return {
    rows,
    assigneeRows,
    flagRows: assignedFlags.map((row) => ({
      subTaskId: row.subTaskId,
      code: formatMaterialFlagCode(row.categoryRef, row.index),
    })),
    dependencyRows,
  };
}

export async function listSubTaskCompletionSnapshotsForTasks(
  taskIds: string[],
  db: Db = getDb(),
) {
  if (taskIds.length === 0) return [];
  return db
    .select({
      taskId: subTasks.taskId,
      status: subTasks.status,
      activationStatus: subTasks.activationStatus,
    })
    .from(subTasks)
    .where(inArray(subTasks.taskId, taskIds));
}

export async function listActiveTasksForBoard(db: Db = getDb()) {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.active, true))
    .orderBy(asc(tasks.index));
}

/** Next board index without loading every active task row. */
export async function getNextActiveTaskIndex(db: Db = getDb()): Promise<number> {
  const [row] = await db
    .select({ value: max(tasks.index) })
    .from(tasks)
    .where(eq(tasks.active, true));
  const currentMax = row?.value ?? 0;
  return currentMax + 1;
}

export type BoardTaskOrderRow = {
  id: string;
  stepId: string | null;
  index: number;
  deliveryDate: string | null;
  createdAt: Date;
};

export type BoardTaskLayoutRow = {
  id: string;
  name: string;
  qty: number;
  status: InferSelectModel<typeof tasks>["status"];
  stepId: string | null;
  index: number;
  deliveryDate: string | null;
  endedAt: Date | null;
  totalExpectedTime: number;
  totalTimeSpent: number;
};

export async function listActiveTaskOrderRows(
  db: Db = getDb(),
): Promise<BoardTaskOrderRow[]> {
  return db
    .select({
      id: tasks.id,
      stepId: tasks.stepId,
      index: tasks.index,
      deliveryDate: tasks.deliveryDate,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .where(eq(tasks.active, true));
}

export async function listActiveTaskLayoutRows(
  db: Db = getDb(),
): Promise<BoardTaskLayoutRow[]> {
  return db
    .select({
      id: tasks.id,
      name: tasks.name,
      qty: tasks.qty,
      status: tasks.status,
      stepId: tasks.stepId,
      index: tasks.index,
      deliveryDate: tasks.deliveryDate,
      endedAt: tasks.endedAt,
      totalExpectedTime: tasks.totalExpectedTime,
      totalTimeSpent: tasks.totalTimeSpent,
    })
    .from(tasks)
    .where(eq(tasks.active, true));
}

export async function countActiveTasksByStepId(
  stepId: string,
  db: Db = getDb(),
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(tasks)
    .where(and(eq(tasks.active, true), eq(tasks.stepId, stepId)));
  return row?.value ?? 0;
}

export async function listActiveTasksForBoardColumn(
  stepUuid: string,
  orderBy: StepTaskOrderBy,
  options: { limit: number; cursor?: BoardColumnPageCursor | null },
  db: Db = getDb(),
) {
  const lightRows = await db
    .select({
      id: tasks.id,
      index: tasks.index,
      deliveryDate: tasks.deliveryDate,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .where(and(eq(tasks.active, true), eq(tasks.stepId, stepUuid)));

  const page = selectBoardColumnPage(lightRows, orderBy, options);
  if (page.length === 0) return [];

  const pageIds = page.map((row) => row.id);
  const fullRows = await db
    .select()
    .from(tasks)
    .where(inArray(tasks.id, pageIds));
  const byId = new Map(fullRows.map((row) => [row.id, row]));
  return pageIds
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => row != null);
}

export type { BoardColumnPageCursor };

export async function getActiveTasksRevision(
  db: Db = getDb(),
): Promise<TasksRevision> {
  const [row] = await db
    .select({
      count: count(),
      maxUpdatedAt: max(tasks.updatedAt),
    })
    .from(tasks)
    .where(eq(tasks.active, true));

  return {
    count: row?.count ?? 0,
    maxUpdatedAt: row?.maxUpdatedAt?.toISOString() ?? null,
  };
}

export async function getTaskById(id: string, db: Db = getDb()) {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return row ?? null;
}

export type CrmPedidoTaskRecord = {
  id: string;
  name: string;
  qty: number;
  deliveryDate: string | null;
};

export async function findTaskByCrmItemKey(
  crmItemKey: string,
  db: Db = getDb(),
): Promise<CrmPedidoTaskRecord | null> {
  const [row] = await db
    .select({
      id: tasks.id,
      name: tasks.name,
      qty: tasks.qty,
      deliveryDate: tasks.deliveryDate,
    })
    .from(tasks)
    .where(eq(tasks.crmItemKey, crmItemKey))
    .limit(1);
  return row ?? null;
}

/** Alias for plugins: persists against `tasks.crm_item_key` today. */
export async function findTaskByExternalKey(
  externalKey: string,
  db: Db = getDb(),
): Promise<CrmPedidoTaskRecord | null> {
  return findTaskByCrmItemKey(externalKey, db);
}

export async function updateCrmPedidoTaskFields(
  id: string,
  input: { name: string; qty: number; deliveryDate?: string | null },
  db: Db = getDb(),
) {
  const [row] = await db
    .update(tasks)
    .set({
      name: input.name.trim(),
      qty: Math.max(1, input.qty),
      deliveryDate: input.deliveryDate ?? null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  if (!row) throw new Error("taskNotFound");
  return row;
}

export type UpdateTaskInput = {
  name: string;
  qty: number;
  deliveryDate?: string | null;
  status: CreateTaskInput["status"];
  templateTaskCode?: string | null;
};

export async function updateTaskFields(
  id: string,
  input: UpdateTaskInput,
  db: Db = getDb(),
) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ id: tasks.id, qty: tasks.qty })
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    if (!current) throw new Error("taskNotFound");

    const nextQty = Math.max(1, input.qty);
    const previousQty = Math.max(1, current.qty);

    if (previousQty !== nextQty) {
      const rows = await tx
        .select({
          id: subTasks.id,
          qty: subTasks.qty,
          expectedTime: subTasks.expectedTime,
        })
        .from(subTasks)
        .where(eq(subTasks.taskId, id));

      let totalExpected = 0;
      for (const row of rows) {
        const qty = rescaleQtyForTaskQtyChange(
          row.qty,
          previousQty,
          nextQty,
        );
        const expectedTime = rescaleExpectedTimeForTaskQtyChange(
          row.expectedTime,
          previousQty,
          nextQty,
        );
        totalExpected += expectedTime;
        await tx
          .update(subTasks)
          .set({ qty, expectedTime, updatedAt: new Date() })
          .where(eq(subTasks.id, row.id));
      }

      await tx
        .update(tasks)
        .set({ totalExpectedTime: totalExpected })
        .where(eq(tasks.id, id));
    }

    const [row] = await tx
      .update(tasks)
      .set({
        name: input.name.trim(),
        qty: nextQty,
        deliveryDate: input.deliveryDate ?? null,
        status: input.status,
        templateTaskCode: input.templateTaskCode?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();
    if (!row) throw new Error("taskNotFound");
    return row;
  });
}

export async function setTaskActive(
  id: string,
  active: boolean,
  db: Db = getDb(),
) {
  const [row] = await db
    .update(tasks)
    .set({
      active,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  if (!row) throw new Error("taskNotFound");
  return row;
}

export async function archiveTasks(
  ids: string[],
  reason: string,
  db: Db = getDb(),
) {
  return archiveRecords(
    {
      tableName: DEACTIVATION_TABLE.tasks,
      recordIds: ids,
      text: reason,
      setInactive: async (recordIds, tx) => {
        await tx
          .update(tasks)
          .set({ active: false, updatedAt: new Date() })
          .where(inArray(tasks.id, recordIds));
      },
    },
    db,
  );
}

export async function deleteTaskById(id: string, db: Db = getDb()): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function deleteTasksByCrmPedidoId(
  crmPedidoId: number,
  db: Db = getDb(),
): Promise<number> {
  const rows = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.crmPedidoId, crmPedidoId));
  if (rows.length === 0) {
    return 0;
  }
  await db.delete(tasks).where(eq(tasks.crmPedidoId, crmPedidoId));
  return rows.length;
}

export async function updateTaskBoardFields(
  id: string,
  input: { index: number; stepId?: string | null },
  db: Db = getDb(),
): Promise<void> {
  const patch: { index: number; stepId?: string | null; updatedAt: Date } = {
    index: input.index,
    updatedAt: new Date(),
  };
  if (input.stepId !== undefined) {
    patch.stepId = input.stepId;
  }
  await db.update(tasks).set(patch).where(eq(tasks.id, id));
}

export async function applyTaskIndexUpdates(
  updates: Array<{ id: string; index: number }>,
  db: Db = getDb(),
): Promise<void> {
  if (updates.length === 0) return;

  const now = new Date();
  await db.transaction(async (tx) => {
    for (const update of updates) {
      await tx
        .update(tasks)
        .set({ index: update.index, updatedAt: now })
        .where(eq(tasks.id, update.id));
    }
  });
}

export async function assignColaboratorsToSubTask(
  subTaskId: string,
  userIds: string[],
  db: Db = getDb(),
): Promise<void> {
  await replaceSubTaskAssignees(subTaskId, userIds, db);
}

export async function replaceSubTaskAssignees(
  subTaskId: string,
  userIds: string[],
  db: Db = getDb(),
): Promise<void> {
  await db.delete(subTaskAssignees).where(eq(subTaskAssignees.subTaskId, subTaskId));
  if (userIds.length === 0) return;
  await db.insert(subTaskAssignees).values(
    userIds.map((userId) => ({ subTaskId, userId })),
  );
}

export async function updateSubTaskLinkedToPrevious(
  id: string,
  linkedToPrevious: boolean,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(subTasks)
    .set({ linkedToPrevious, updatedAt: new Date() })
    .where(eq(subTasks.id, id));
}

async function replaceSubTaskDependencies(
  subTaskId: string,
  dependsOnIds: string[],
  db: Db,
): Promise<void> {
  await db
    .delete(subTaskDependencies)
    .where(eq(subTaskDependencies.subTaskId, subTaskId));
  for (const dependsOnSubTaskId of dependsOnIds) {
    await db.insert(subTaskDependencies).values({ subTaskId, dependsOnSubTaskId });
  }
}

export async function getSubTaskById(id: string, db: Db = getDb()) {
  const [row] = await db.select().from(subTasks).where(eq(subTasks.id, id)).limit(1);
  return row ?? null;
}

export async function listSubTaskIdsForTask(
  taskId: string,
  db: Db = getDb(),
): Promise<string[]> {
  const rows = await db
    .select({ id: subTasks.id })
    .from(subTasks)
    .where(eq(subTasks.taskId, taskId));
  return rows.map((row) => row.id);
}

export type SubTaskWithAssignees = Awaited<
  ReturnType<typeof listSubTasksForTask>
>[number] & {
  assignedToIds: string[];
  dependencyIds: string[];
};

export async function listSubTasksWithRelationsForTask(
  taskId: string,
  db: Db = getDb(),
): Promise<SubTaskWithAssignees[]> {
  return listSubTasksWithRelationsForTasks([taskId], db);
}

export async function listSubTasksWithRelationsForTasks(
  taskIds: readonly string[],
  db: Db = getDb(),
): Promise<SubTaskWithAssignees[]> {
  const rows = await listSubTasksForTasks(taskIds, db);
  if (rows.length === 0) return [];

  const subTaskIds = rows.map((row) => row.id);
  const [assigneeRows, dependencyRows] = await Promise.all([
    db
      .select({
        subTaskId: subTaskAssignees.subTaskId,
        userId: subTaskAssignees.userId,
      })
      .from(subTaskAssignees)
      .where(inArray(subTaskAssignees.subTaskId, subTaskIds)),
    db
      .select({
        subTaskId: subTaskDependencies.subTaskId,
        dependsOnSubTaskId: subTaskDependencies.dependsOnSubTaskId,
      })
      .from(subTaskDependencies)
      .where(inArray(subTaskDependencies.subTaskId, subTaskIds)),
  ]);

  const assigneesBySubTask = new Map<string, string[]>();
  for (const row of assigneeRows) {
    const list = assigneesBySubTask.get(row.subTaskId) ?? [];
    list.push(row.userId);
    assigneesBySubTask.set(row.subTaskId, list);
  }

  const depsBySubTask = new Map<string, string[]>();
  for (const row of dependencyRows) {
    const list = depsBySubTask.get(row.subTaskId) ?? [];
    list.push(row.dependsOnSubTaskId);
    depsBySubTask.set(row.subTaskId, list);
  }

  return rows.map((row) => ({
    ...row,
    assignedToIds: assigneesBySubTask.get(row.id) ?? [],
    dependencyIds: depsBySubTask.get(row.id) ?? [],
  }));
}

export async function createSubTaskForTask(
  taskId: string,
  input: SubTaskFormInput,
  index: number,
  db: Db = getDb(),
) {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(subTasks)
      .values({
        taskId,
        name: input.name.trim(),
        qty: input.qty,
        index,
        expectedTime: input.expectedTime,
        sharingType: input.sharingType,
        maxSameTimeWorkers: input.maxSameTimeWorkers,
        status: input.status,
        activationStatus: toDrizzleActivationStatus(input.activationStatus),
        subTaskCategoryId: input.subTaskCategoryId || null,
      })
      .returning();

    await replaceSubTaskAssignees(
      created.id,
      input.assignedToIds ?? [],
      tx as unknown as Db,
    );
    await replaceSubTaskDependencies(
      created.id,
      input.dependencyIds ?? [],
      tx as unknown as Db,
    );
    return created;
  });
}

export async function updateSubTaskFields(
  id: string,
  taskId: string,
  input: SubTaskFormInput,
  index: number,
  db: Db = getDb(),
) {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(subTasks)
      .set({
        taskId,
        name: input.name.trim(),
        qty: input.qty,
        index,
        expectedTime: input.expectedTime,
        sharingType: input.sharingType,
        maxSameTimeWorkers: input.maxSameTimeWorkers,
        status: input.status,
        activationStatus: toDrizzleActivationStatus(input.activationStatus),
        subTaskCategoryId: input.subTaskCategoryId || null,
        updatedAt: new Date(),
      })
      .where(eq(subTasks.id, id))
      .returning();
    if (!updated) throw new Error("subTaskNotFound");

    await replaceSubTaskAssignees(
      id,
      input.assignedToIds ?? [],
      tx as unknown as Db,
    );
    await replaceSubTaskDependencies(
      id,
      input.dependencyIds ?? [],
      tx as unknown as Db,
    );
    return updated;
  });
}

export async function updateSubTaskIndex(
  id: string,
  index: number,
  taskId: string,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(subTasks)
    .set({ index, taskId, updatedAt: new Date() })
    .where(eq(subTasks.id, id));
}

export async function deleteSubTaskById(id: string, db: Db = getDb()): Promise<void> {
  await db.delete(subTasks).where(eq(subTasks.id, id));
}

export async function listSubTaskActivitySessions(
  subTaskId: string,
  db: Db = getDb(),
): Promise<ActivitySession[]> {
  const activityRows = await listBoardSubtaskSessionHistory([subTaskId], db);
  return listActivitySessions(toActivitySessionRefs(activityRows));
}

/**
 * Records start/stop activity via kiosk lifecycle (status, sync, currency).
 */
export async function recordActivity(
  input: {
    subTaskId: string;
    colaboratorId: string;
    action: "started" | "stoped";
    qty?: number;
    completed?: boolean;
    timestamp?: Date;
  },
  db: Db = getDb(),
) {
  const result = await recordActivityViaKiosk(input, db);
  return {
    id: "",
    subTaskId: input.subTaskId,
    colaboratorId: input.colaboratorId,
    action: input.action,
    timestamp: input.timestamp ?? new Date(),
    qty: input.qty ?? 0,
    currencyAwarded: result.currencyAwarded,
  };
}
