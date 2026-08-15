import { and, asc, eq, inArray } from "drizzle-orm";

import {
  activities,
  subTaskDependencies,
  subTasks,
  tasks,
  users,
} from "@/drizzle/schema";
import {
  activationUpdateToDrizzle,
  buildActivationSyncRows,
  buildSubTaskTimeSpentInputs,
  resolveParentTaskSyncUpdate,
} from "@/lib/business/subtask-lifecycle";
import { resolveSubTaskActivationStatusUpdates } from "@/lib/business/subtask-activation-sync";
import { fromDrizzleActivationStatus } from "@/lib/domain/subtask-activation-map";
import { calculateTaskTotalTimeSpent } from "@/lib/business/task-time-spent";
import type { ActivityTimeRow } from "@/lib/business/task-time-spent";
import { getDb, type Db } from "@/lib/db/client";

async function loadTaskSubTaskContext(
  taskId: string,
  tx: Db,
): Promise<{
  siblings: Array<{
    id: string;
    status: string;
    activationStatus: string;
    maxSameTimeWorkers: number;
    timeSpent: number;
    dependencyIds: string[];
  }>;
  activitiesBySubTaskId: Map<string, ActivityTimeRow[]>;
}> {
  const siblingRows = await tx
    .select()
    .from(subTasks)
    .where(eq(subTasks.taskId, taskId))
    .orderBy(asc(subTasks.index));

  if (siblingRows.length === 0) {
    return { siblings: [], activitiesBySubTaskId: new Map() };
  }

  const subTaskIds = siblingRows.map((row) => row.id);
  const dependencyRows = await tx
    .select({
      subTaskId: subTaskDependencies.subTaskId,
      dependsOnSubTaskId: subTaskDependencies.dependsOnSubTaskId,
    })
    .from(subTaskDependencies)
    .where(inArray(subTaskDependencies.subTaskId, subTaskIds));

  const depsBySubTask = new Map<string, string[]>();
  for (const row of dependencyRows) {
    const list = depsBySubTask.get(row.subTaskId) ?? [];
    list.push(row.dependsOnSubTaskId);
    depsBySubTask.set(row.subTaskId, list);
  }

  const activityRows = await tx
    .select({
      action: activities.action,
      timestamp: activities.timestamp,
      colaboratorId: activities.colaboratorId,
      subTaskId: activities.subTaskId,
    })
    .from(activities)
    .where(
      and(
        inArray(activities.subTaskId, subTaskIds),
        inArray(activities.action, ["started", "stoped"]),
      ),
    )
    .orderBy(asc(activities.timestamp));

  const activitiesBySubTaskId = new Map<string, ActivityTimeRow[]>();
  for (const row of activityRows) {
    const list = activitiesBySubTaskId.get(row.subTaskId) ?? [];
    list.push({
      action: row.action,
      timestamp: new Date(row.timestamp),
      colaboratorId: row.colaboratorId,
    });
    activitiesBySubTaskId.set(row.subTaskId, list);
  }

  const siblings = siblingRows.map((row) => ({
    id: row.id,
    status: row.status,
    activationStatus: row.activationStatus,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    timeSpent: row.timeSpent,
    dependencyIds: depsBySubTask.get(row.id) ?? [],
  }));

  return { siblings, activitiesBySubTaskId };
}

/**
 * Recomputes activation statuses, parent task status, and total time spent
 * for all sub-tasks of a task (Strapi runTaskSubTaskSyncRoutine + parent rollup).
 */
export async function runTaskSubTaskSyncRoutine(
  taskId: string,
  db: Db = getDb(),
  now: Date = new Date(),
): Promise<void> {
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  if (!task) return;

  const { siblings, activitiesBySubTaskId } = await loadTaskSubTaskContext(
    taskId,
    db,
  );
  if (siblings.length === 0) return;

  const activationRows = buildActivationSyncRows(siblings, activitiesBySubTaskId);
  const activationUpdates = resolveSubTaskActivationStatusUpdates(activationRows);

  for (const [subTaskId, nextActivation] of activationUpdates) {
    await db
      .update(subTasks)
      .set({
        activationStatus: activationUpdateToDrizzle(nextActivation),
        updatedAt: now,
      })
      .where(eq(subTasks.id, subTaskId));
  }

  const siblingsForCompletion = siblings.map((row) => ({
    status: row.status,
    activationStatus: fromDrizzleActivationStatus(row.activationStatus),
  }));

  const parentUpdate = resolveParentTaskSyncUpdate(
    {
      currentStatus: task.status,
      currentStartedAt: task.startedAt,
      currentEndedAt: task.endedAt,
      siblings: siblingsForCompletion,
    },
    now,
  );

  const timeSpentInputs = buildSubTaskTimeSpentInputs(
    siblings,
    activitiesBySubTaskId,
  );
  const totalTimeSpent = calculateTaskTotalTimeSpent(timeSpentInputs, now);

  const taskPatch: {
    totalTimeSpent: number;
    updatedAt: Date;
    status?: typeof task.status;
    startedAt?: Date | null;
    endedAt?: Date | null;
  } = {
    totalTimeSpent,
    updatedAt: now,
  };

  if (parentUpdate) {
    taskPatch.status = parentUpdate.status;
    taskPatch.startedAt = parentUpdate.startedAt;
    taskPatch.endedAt = parentUpdate.endedAt;
  }

  await db.update(tasks).set(taskPatch).where(eq(tasks.id, taskId));
}

export async function fetchUserNamesByIds(
  userIds: string[],
  db: Db = getDb(),
): Promise<string[]> {
  if (userIds.length === 0) return [];
  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, userIds));
  const nameById = new Map(rows.map((row) => [row.id, row.name]));
  return userIds
    .map((id) => nameById.get(id)?.trim() ?? "")
    .filter(Boolean);
}
