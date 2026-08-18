import { and, asc, count, desc, eq, inArray, max, type InferSelectModel } from "drizzle-orm";

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
import { scaleExpectedTimeByTaskQty } from "@/lib/domain/work-currency";
import { getDb, type Db } from "@/lib/db/client";
import type { TasksRevision } from "@/lib/tasks/tasks-revision";
import { recordActivityViaKiosk } from "@/lib/repos/kiosk-subtasks";
import { listAssignedFlagsForSubTasks } from "@/lib/repos/material-flags";
import { formatMaterialFlagCode } from "@/lib/business/material-flag-code";
import { runTaskSubTaskSyncRoutine } from "@/lib/repos/subtask-lifecycle";

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

export async function createTask(
  input: CreateTaskInput,
  db: Db = getDb(),
) {
  return db.transaction(async (tx) => {
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

        for (const row of templateRows) {
          const expectedTime = scaleExpectedTimeByTaskQty(
            row.expectedTime,
            qty,
          );
          totalExpected += expectedTime;
          const [created] = await tx
            .insert(subTasks)
            .values({
              taskId: task.id,
              name: row.name,
              qty: row.qty,
              index: row.index,
              expectedTime,
              sharingType: row.sharingType,
              maxSameTimeWorkers: row.maxSameTimeWorkers,
              linkedToPrevious: row.linkedToPrevious,
              subTaskCategoryId: row.subTaskCategoryId,
            })
            .returning({ id: subTasks.id, index: subTasks.index });
          createdByIndex.set(created.index, created.id);
        }

        for (const row of templateRows) {
          const subId = createdByIndex.get(row.index);
          if (!subId) continue;
          for (const depIndex of row.dependencyIndexes ?? []) {
            const depId = createdByIndex.get(depIndex);
            if (!depId) continue;
            await tx.insert(subTaskDependencies).values({
              subTaskId: subId,
              dependsOnSubTaskId: depId,
            });
          }
        }

        await tx
          .update(tasks)
          .set({ totalExpectedTime: totalExpected, updatedAt: new Date() })
          .where(eq(tasks.id, task.id));

        await runTaskSubTaskSyncRoutine(
          task.id,
          tx as unknown as Db,
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

const E2E_TASK_DEACTIVATION_REASON =
  "E2E cleanup: deactivate duplicate create-task fixture so the manager " +
  "create flow can run repeatedly without leaving active clones.";

export async function deactivateActiveTasksByName(
  name: string,
  reasonForDeactivation: string = E2E_TASK_DEACTIVATION_REASON,
  db: Db = getDb(),
): Promise<number> {
  const result = await db
    .update(tasks)
    .set({
      active: false,
      reasonForDeactivation,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.name, name), eq(tasks.active, true)))
    .returning({ id: tasks.id });
  return result.length;
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
  const [assigneeRows, assignedFlags, dependencyRows] = await Promise.all([
    listBoardSubtaskAssignees(ids, db),
    listAssignedFlagsForSubTasks(ids, db),
    db
      .select({
        consumerId: subTaskDependencies.subTaskId,
        producerId: subTaskDependencies.dependsOnSubTaskId,
      })
      .from(subTaskDependencies)
      .where(inArray(subTaskDependencies.subTaskId, ids)),
  ]);

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
  const [row] = await db
    .update(tasks)
    .set({
      name: input.name.trim(),
      qty: Math.max(1, input.qty),
      deliveryDate: input.deliveryDate ?? null,
      status: input.status,
      templateTaskCode: input.templateTaskCode?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  if (!row) throw new Error("taskNotFound");
  return row;
}

export async function setTaskActive(
  id: string,
  active: boolean,
  reasonForDeactivation: string,
  db: Db = getDb(),
) {
  const [row] = await db
    .update(tasks)
    .set({
      active,
      reasonForDeactivation: reasonForDeactivation.trim(),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  if (!row) throw new Error("taskNotFound");
  return row;
}

export async function deleteTaskById(id: string, db: Db = getDb()): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
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
