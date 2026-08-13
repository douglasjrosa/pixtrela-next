import { and, count, eq, max } from "drizzle-orm";

import type { BoardRevision } from "@/lib/board/board-revision";
import {
  activities,
  steps,
  subTaskAssignees,
  subTasks,
  tasks,
} from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

const ACTIVE_TASK_FILTER = eq(tasks.active, true);

const ACTIVE_BOARD_SUBTASK_FILTER = and(
  eq(tasks.active, true),
  eq(subTasks.active, true),
);

/**
 * Lightweight revision fingerprint for the production board.
 * Covers task layout/status, sub-task state, kiosk activity, assignees, and steps.
 */
export async function getBoardRevision(db: Db = getDb()): Promise<BoardRevision> {
  const [taskRow, subTaskRow, activityRow, assigneeRow, stepRow] =
    await Promise.all([
      db
        .select({
          count: count(),
          maxUpdatedAt: max(tasks.updatedAt),
        })
        .from(tasks)
        .where(ACTIVE_TASK_FILTER),
      db
        .select({ maxUpdatedAt: max(subTasks.updatedAt) })
        .from(subTasks)
        .innerJoin(tasks, eq(subTasks.taskId, tasks.id))
        .where(ACTIVE_BOARD_SUBTASK_FILTER),
      db
        .select({ maxTimestamp: max(activities.timestamp) })
        .from(activities)
        .innerJoin(subTasks, eq(activities.subTaskId, subTasks.id))
        .innerJoin(tasks, eq(subTasks.taskId, tasks.id))
        .where(ACTIVE_TASK_FILTER),
      db
        .select({ count: count() })
        .from(subTaskAssignees)
        .innerJoin(subTasks, eq(subTaskAssignees.subTaskId, subTasks.id))
        .innerJoin(tasks, eq(subTasks.taskId, tasks.id))
        .where(ACTIVE_BOARD_SUBTASK_FILTER),
      db.select({ maxUpdatedAt: max(steps.updatedAt) }).from(steps),
    ]);

  return {
    activeTaskCount: taskRow[0]?.count ?? 0,
    tasksMaxUpdatedAt: taskRow[0]?.maxUpdatedAt?.toISOString() ?? null,
    subTasksMaxUpdatedAt: subTaskRow[0]?.maxUpdatedAt?.toISOString() ?? null,
    activitiesMaxTimestamp: activityRow[0]?.maxTimestamp?.toISOString() ?? null,
    assigneeCount: assigneeRow[0]?.count ?? 0,
    stepsMaxUpdatedAt: stepRow[0]?.maxUpdatedAt?.toISOString() ?? null,
  };
}
