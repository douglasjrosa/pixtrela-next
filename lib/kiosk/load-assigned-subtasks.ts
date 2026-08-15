import { and, asc, eq, inArray } from "drizzle-orm";

import type { KioskSubTask } from "@/lib/business/subtask-queue";
import {
  listOpenColaboratorDocumentIds,
  resolveOpenActivitySessions,
  type ActivitySessionRef,
} from "@/lib/business/task-progress";
import { activities, subTaskAssignees, subTasks, tasks } from "@/drizzle/schema";
import { getDb } from "@/lib/db/client";
import { fromDrizzleActivationStatus } from "@/lib/domain/subtask-activation-map";
import { resolveSubTaskTargetQty } from "@/lib/domain/work-currency";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";

export async function loadAssignedSubTasksForColaborator(
  colaboratorId: string,
): Promise<KioskSubTask[]> {
  try {
    const db = getDb();
    const assigned = await db
      .select({ subTaskId: subTaskAssignees.subTaskId })
      .from(subTaskAssignees)
      .where(eq(subTaskAssignees.userId, colaboratorId));

    const subTaskIds = assigned.map((row) => row.subTaskId);
    if (subTaskIds.length === 0) return [];

    const rows = await db
      .select({
        id: subTasks.id,
        name: subTasks.name,
        index: subTasks.index,
        status: subTasks.status,
        activationStatus: subTasks.activationStatus,
        qty: subTasks.qty,
        sharingType: subTasks.sharingType,
        timeSpent: subTasks.timeSpent,
        expectedTime: subTasks.expectedTime,
        taskId: subTasks.taskId,
        taskName: tasks.name,
        taskIndex: tasks.index,
        taskQty: tasks.qty,
      })
      .from(subTasks)
      .innerJoin(tasks, eq(subTasks.taskId, tasks.id))
      .where(
        and(
          inArray(subTasks.id, subTaskIds),
          eq(subTasks.active, true),
          eq(tasks.active, true),
        ),
      )
      .orderBy(asc(tasks.index), asc(subTasks.index));

    const activityRows = await db
      .select({
        action: activities.action,
        timestamp: activities.timestamp,
        qty: activities.qty,
        subTaskId: activities.subTaskId,
        colaboratorId: activities.colaboratorId,
      })
      .from(activities)
      .where(
        and(
          inArray(activities.subTaskId, subTaskIds),
          inArray(activities.action, ["started", "stoped"]),
        ),
      )
      .orderBy(asc(activities.timestamp));

    const activitiesBySubTask = new Map<string, ActivitySessionRef[]>();
    for (const row of activityRows) {
      const list = activitiesBySubTask.get(row.subTaskId) ?? [];
      list.push({
        subTaskDocumentId: row.subTaskId,
        colaboratorDocumentId: row.colaboratorId,
        action: row.action,
        timestamp: row.timestamp.toISOString(),
        qty: row.qty,
      });
      activitiesBySubTask.set(row.subTaskId, list);
    }

    return rows.map((row) => {
      const refs = activitiesBySubTask.get(row.id) ?? [];
      const openSessions = resolveOpenActivitySessions(refs);
      const viewerSession = openSessions.get(`${row.id}:${colaboratorId}`);
      const targetQty = resolveSubTaskTargetQty(row.qty, row.taskQty);

      const completedQty =
        row.sharingType === "qty"
          ? refs
              .filter((ref) => ref.action === "stoped")
              .reduce((sum, ref) => sum + (ref.qty ?? 0), 0)
          : 0;

      let finishedAt: string | null = null;
      if (row.status === "finished") {
        const lastStop = [...refs]
          .reverse()
          .find((ref) => ref.action === "stoped");
        finishedAt = lastStop?.timestamp ?? null;
      }

      return {
        documentId: row.id,
        name: row.name,
        index: row.index,
        status: row.status as KioskSubTask["status"],
        activationStatus: fromDrizzleActivationStatus(row.activationStatus),
        qty: row.qty,
        targetQty,
        completedQty,
        sharingType: row.sharingType as KioskSubTask["sharingType"],
        timeSpent: row.timeSpent,
        startedAt: viewerSession?.startedAt ?? null,
        expectedTime: row.expectedTime,
        taskDocumentId: row.taskId,
        taskName: row.taskName,
        taskIndex: row.taskIndex,
        finishedAt,
        activeWorkerCount: listOpenColaboratorDocumentIds(refs).length,
      };
    });
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
