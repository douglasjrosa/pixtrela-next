import { and, asc, eq, inArray, ne } from "drizzle-orm";

import {
  countAssignedSubTasksByColaborator,
} from "@/lib/business/assign-warn";
import {
  countOpenColaborators,
  countUniqueColaboratorIds,
  countUnassignedSubTasks,
} from "@/lib/business/kanban-card-badges";
import {
  isCompletedTaskStatus,
  listOpenActivityStartedAts,
  shouldShowKanbanTaskProgress,
  type BoardTaskProgressInput,
  type KanbanProgressStatus,
} from "@/lib/business/task-progress";
import { isDrizzleBackend } from "@/lib/db/backend";
import { getDb } from "@/lib/db/client";
import {
  activities,
  subTaskAssignees,
  subTasks,
} from "@/drizzle/schema";
import { STRAPI_TAGS, strapiFetch, type StrapiCacheOptions } from "@/lib/strapi";

interface StrapiList<T> {
  data: T[];
}

interface SubTaskProgressEntity {
  documentId: string;
  status: KanbanProgressStatus;
  activationStatus?: string | null;
  expectedTime?: number;
  timeSpent?: number;
  task?: { documentId?: string } | null;
  assignedTo?: { documentId?: string }[] | null;
}

interface ActivityProgressEntity {
  action: "started" | "stoped";
  timestamp?: string | null;
  subTask?: {
    documentId?: string;
    task?: { documentId?: string } | null;
  } | null;
  colaborator?: { documentId?: string } | null;
}

export type BoardCardBadges = {
  activeColaboratorCount: number;
  unassignedSubTaskCount: number;
  /** Unique colaborators who worked on a finished task. */
  participantCount: number;
};

export type BoardProgressLoadResult = {
  progressByTaskId: Record<string, BoardTaskProgressInput>;
  badgesByTaskId: Record<string, BoardCardBadges>;
  assignedCountByColaboratorId: Record<string, number>;
};

const PROGRESS_REVALIDATE_SEC = 15;
const SUBTASK_PAGE_SIZE = 500;
const ACTIVITY_PAGE_SIZE = 1000;
const FINISHED_STATUS = "finished";
const DISABLED_ACTIVATION = "disabled";

function emptyProgress(): BoardTaskProgressInput {
  return { subTasks: [], openActivityStartedAts: [] };
}

function emptyBadges(): BoardCardBadges {
  return {
    activeColaboratorCount: 0,
    unassignedSubTaskCount: 0,
    participantCount: 0,
  };
}

function emptyLoadResult(): BoardProgressLoadResult {
  return {
    progressByTaskId: {},
    badgesByTaskId: {},
    assignedCountByColaboratorId: {},
  };
}

function toActivitySessionRefs(activityRows: ActivityProgressEntity[]) {
  return activityRows.flatMap((activity) => {
    const subTaskDocumentId = activity.subTask?.documentId;
    const colaboratorDocumentId = activity.colaborator?.documentId;
    const timestamp = activity.timestamp;
    if (!subTaskDocumentId || !colaboratorDocumentId || !timestamp) {
      return [];
    }
    return [
      {
        subTaskDocumentId,
        colaboratorDocumentId,
        action: activity.action,
        timestamp,
      },
    ];
  });
}

function resolveProgressCache(
  noStore: boolean,
  tags: string[],
): StrapiCacheOptions {
  if (noStore) return { noStore: true };
  return { tags, revalidate: PROGRESS_REVALIDATE_SEC };
}

function initContainers(
  allTaskIds: string[],
  progressTaskIds: Set<string>,
) {
  const progressByTaskId: Record<string, BoardTaskProgressInput> = {};
  const badgesByTaskId: Record<string, BoardCardBadges> = {};
  const assignedCountsByTask = new Map<string, number[]>();

  for (const taskId of allTaskIds) {
    badgesByTaskId[taskId] = emptyBadges();
    assignedCountsByTask.set(taskId, []);
    if (progressTaskIds.has(taskId)) {
      progressByTaskId[taskId] = emptyProgress();
    }
  }

  return { progressByTaskId, badgesByTaskId, assignedCountsByTask };
}

function applySubTaskRows(
  rows: SubTaskProgressEntity[],
  progressByTaskId: Record<string, BoardTaskProgressInput>,
  badgesByTaskId: Record<string, BoardCardBadges>,
  assignedCountsByTask: Map<string, number[]>,
) {
  const assignedSubTaskInputs: { assignedToIds: string[] }[] = [];
  const producingSubTaskIds: string[] = [];
  const taskIdByProducingSubTask = new Map<string, string>();

  for (const subTask of rows) {
    const taskDocumentId = subTask.task?.documentId;
    if (!taskDocumentId || !badgesByTaskId[taskDocumentId]) continue;

    const assignedToIds =
      subTask.assignedTo
        ?.map((user) => user.documentId)
        .filter((id): id is string => Boolean(id)) ?? [];
    assignedSubTaskInputs.push({ assignedToIds });
    assignedCountsByTask.get(taskDocumentId)?.push(assignedToIds.length);

    const progress = progressByTaskId[taskDocumentId];
    if (progress) {
      progress.subTasks.push({
        status: subTask.status,
        activationStatus: subTask.activationStatus ?? null,
        expectedTime: subTask.expectedTime ?? 0,
        timeSpent: subTask.timeSpent ?? 0,
      });
    }

    if (subTask.status === "producing") {
      producingSubTaskIds.push(subTask.documentId);
      taskIdByProducingSubTask.set(subTask.documentId, taskDocumentId);
    }
  }

  for (const [taskDocumentId, assignedCounts] of assignedCountsByTask) {
    const badges = badgesByTaskId[taskDocumentId];
    if (!badges) continue;
    badges.unassignedSubTaskCount = countUnassignedSubTasks(
      assignedCounts.map((assignedCount) => ({ assignedCount })),
    );
  }

  return {
    assignedCountByColaboratorId:
      countAssignedSubTasksByColaborator(assignedSubTaskInputs),
    producingSubTaskIds,
    taskIdByProducingSubTask,
  };
}

function applyOpenActivities(
  activityRows: ActivityProgressEntity[],
  taskIdByProducingSubTask: Map<string, string>,
  progressByTaskId: Record<string, BoardTaskProgressInput>,
  badgesByTaskId: Record<string, BoardCardBadges>,
): void {
  const activitiesByTask = new Map<string, ActivityProgressEntity[]>();
  for (const activity of activityRows) {
    const subTaskDocumentId = activity.subTask?.documentId;
    if (!subTaskDocumentId) continue;
    const taskDocumentId = taskIdByProducingSubTask.get(subTaskDocumentId);
    if (!taskDocumentId) continue;
    const list = activitiesByTask.get(taskDocumentId) ?? [];
    list.push(activity);
    activitiesByTask.set(taskDocumentId, list);
  }

  for (const [taskDocumentId, taskActivities] of activitiesByTask.entries()) {
    const refs = toActivitySessionRefs(taskActivities);
    const progress = progressByTaskId[taskDocumentId];
    if (progress) {
      progress.openActivityStartedAts = listOpenActivityStartedAts(refs);
    }
    const badges = badgesByTaskId[taskDocumentId];
    if (badges) {
      badges.activeColaboratorCount = countOpenColaborators(refs);
    }
  }
}

async function applyFinishedParticipantCountsStrapi(
  finishedTaskIds: readonly string[],
  badgesByTaskId: Record<string, BoardCardBadges>,
  noStore: boolean,
): Promise<void> {
  if (finishedTaskIds.length === 0) return;

  const activitiesRes = await strapiFetch<StrapiList<ActivityProgressEntity>>(
    "/activities",
    {
      strapiCache: resolveProgressCache(noStore, [
        STRAPI_TAGS.activities,
        STRAPI_TAGS.subTasks,
        STRAPI_TAGS.tasks,
      ]),
    },
    {
      fields: ["action"],
      filters: {
        subTask: { task: { documentId: { $in: [...finishedTaskIds] } } },
        action: { $in: ["started", "stoped"] },
      },
      populate: {
        subTask: {
          fields: ["documentId"],
          populate: { task: { fields: ["documentId"] } },
        },
        colaborator: { fields: ["documentId"] },
      },
      pagination: { pageSize: ACTIVITY_PAGE_SIZE },
    },
  );

  applyFinishedParticipantCountsFromRows(activitiesRes.data, badgesByTaskId);
}

function applyFinishedParticipantCountsFromRows(
  activityRows: ActivityProgressEntity[],
  badgesByTaskId: Record<string, BoardCardBadges>,
): void {
  const idsByTask = new Map<string, string[]>();
  for (const activity of activityRows) {
    const taskDocumentId = activity.subTask?.task?.documentId;
    const colaboratorDocumentId = activity.colaborator?.documentId;
    if (!taskDocumentId || !colaboratorDocumentId) continue;
    if (!badgesByTaskId[taskDocumentId]) continue;
    const list = idsByTask.get(taskDocumentId) ?? [];
    list.push(colaboratorDocumentId);
    idsByTask.set(taskDocumentId, list);
  }

  for (const [taskDocumentId, colaboratorIds] of idsByTask) {
    const badges = badgesByTaskId[taskDocumentId];
    if (!badges) continue;
    badges.participantCount = countUniqueColaboratorIds(colaboratorIds);
  }
}

async function loadDrizzleBoardProgress(
  boardTasks: ReadonlyArray<{ documentId: string; status: KanbanProgressStatus }>,
): Promise<BoardProgressLoadResult> {
  const allTaskIds = boardTasks.map((task) => task.documentId);
  const finishedTaskIds = boardTasks
    .filter((task) => isCompletedTaskStatus(task.status))
    .map((task) => task.documentId);
  const progressTaskIds = new Set(
    boardTasks
      .filter((task) => shouldShowKanbanTaskProgress(task.status))
      .map((task) => task.documentId),
  );

  const { progressByTaskId, badgesByTaskId, assignedCountsByTask } =
    initContainers(allTaskIds, progressTaskIds);

  if (allTaskIds.length === 0) {
    return emptyLoadResult();
  }

  const db = getDb();
  const subTaskRows = await db
    .select({
      id: subTasks.id,
      taskId: subTasks.taskId,
      status: subTasks.status,
      activationStatus: subTasks.activationStatus,
      expectedTime: subTasks.expectedTime,
      timeSpent: subTasks.timeSpent,
    })
    .from(subTasks)
    .where(
      and(
        inArray(subTasks.taskId, allTaskIds),
        ne(subTasks.status, FINISHED_STATUS),
      ),
    )
    .limit(SUBTASK_PAGE_SIZE);

  const subTaskIds = subTaskRows.map((row) => row.id);
  const assigneeRows =
    subTaskIds.length === 0
      ? []
      : await db
          .select({
            subTaskId: subTaskAssignees.subTaskId,
            userId: subTaskAssignees.userId,
          })
          .from(subTaskAssignees)
          .where(inArray(subTaskAssignees.subTaskId, subTaskIds));

  const assigneesBySubTask = new Map<string, string[]>();
  for (const row of assigneeRows) {
    const list = assigneesBySubTask.get(row.subTaskId) ?? [];
    list.push(row.userId);
    assigneesBySubTask.set(row.subTaskId, list);
  }

  const mapped: SubTaskProgressEntity[] = subTaskRows.map((row) => ({
    documentId: row.id,
    status: row.status as KanbanProgressStatus,
    activationStatus: row.activationStatus,
    expectedTime: row.expectedTime,
    timeSpent: row.timeSpent,
    task: { documentId: row.taskId },
    assignedTo: (assigneesBySubTask.get(row.id) ?? []).map((id) => ({
      documentId: id,
    })),
  }));

  const {
    assignedCountByColaboratorId,
    producingSubTaskIds,
    taskIdByProducingSubTask,
  } = applySubTaskRows(
    mapped,
    progressByTaskId,
    badgesByTaskId,
    assignedCountsByTask,
  );

  if (producingSubTaskIds.length > 0) {
    const activityRows = await db
      .select({
        action: activities.action,
        timestamp: activities.timestamp,
        subTaskId: activities.subTaskId,
        colaboratorId: activities.colaboratorId,
      })
      .from(activities)
      .where(inArray(activities.subTaskId, producingSubTaskIds))
      .orderBy(asc(activities.timestamp))
      .limit(ACTIVITY_PAGE_SIZE);

    applyOpenActivities(
      activityRows.map((row) => ({
        action: row.action,
        timestamp: row.timestamp.toISOString(),
        subTask: { documentId: row.subTaskId },
        colaborator: { documentId: row.colaboratorId },
      })),
      taskIdByProducingSubTask,
      progressByTaskId,
      badgesByTaskId,
    );
  }

  if (finishedTaskIds.length > 0) {
    const finishedActivityRows = await db
      .select({
        action: activities.action,
        subTaskId: activities.subTaskId,
        colaboratorId: activities.colaboratorId,
        taskId: subTasks.taskId,
      })
      .from(activities)
      .innerJoin(subTasks, eq(activities.subTaskId, subTasks.id))
      .where(inArray(subTasks.taskId, finishedTaskIds))
      .limit(ACTIVITY_PAGE_SIZE);

    applyFinishedParticipantCountsFromRows(
      finishedActivityRows.map((row) => ({
        action: row.action,
        subTask: {
          documentId: row.subTaskId,
          task: { documentId: row.taskId },
        },
        colaborator: { documentId: row.colaboratorId },
      })),
      badgesByTaskId,
    );
  }

  return { progressByTaskId, badgesByTaskId, assignedCountByColaboratorId };
}

/**
 * Loads progress rows for waiting/producing/paused tasks and card badge counts.
 * Open-session activity polling applies only to producing/paused (live) tasks.
 * Completed tasks use persisted totals only (no progress rows here).
 */
export async function loadBoardProgressByTaskId(
  boardTasks: ReadonlyArray<{ documentId: string; status: KanbanProgressStatus }>,
  options?: { noStore?: boolean },
): Promise<BoardProgressLoadResult> {
  if (isDrizzleBackend()) {
    return loadDrizzleBoardProgress(boardTasks);
  }

  const noStore = options?.noStore === true;
  const allTaskIds = boardTasks.map((task) => task.documentId);
  const finishedTaskIds = boardTasks
    .filter((task) => isCompletedTaskStatus(task.status))
    .map((task) => task.documentId);
  const progressTaskIds = new Set(
    boardTasks
      .filter((task) => shouldShowKanbanTaskProgress(task.status))
      .map((task) => task.documentId),
  );

  const { progressByTaskId, badgesByTaskId, assignedCountsByTask } =
    initContainers(allTaskIds, progressTaskIds);

  if (allTaskIds.length === 0) {
    return emptyLoadResult();
  }

  const subTasksRes = await strapiFetch<StrapiList<SubTaskProgressEntity>>(
    "/sub-tasks",
    {
      strapiCache: resolveProgressCache(noStore, [
        STRAPI_TAGS.subTasks,
        STRAPI_TAGS.tasks,
      ]),
    },
    {
      fields: [
        "documentId",
        "status",
        "activationStatus",
        "expectedTime",
        "timeSpent",
      ],
      filters: {
        task: { documentId: { $in: allTaskIds } },
        status: { $ne: FINISHED_STATUS },
        activationStatus: { $ne: DISABLED_ACTIVATION },
      },
      populate: {
        task: { fields: ["documentId"] },
        assignedTo: { fields: ["documentId"] },
      },
      pagination: { pageSize: SUBTASK_PAGE_SIZE },
    },
  );

  const {
    assignedCountByColaboratorId,
    producingSubTaskIds,
    taskIdByProducingSubTask,
  } = applySubTaskRows(
    subTasksRes.data,
    progressByTaskId,
    badgesByTaskId,
    assignedCountsByTask,
  );

  if (producingSubTaskIds.length > 0) {
    const activitiesRes = await strapiFetch<StrapiList<ActivityProgressEntity>>(
      "/activities",
      {
        strapiCache: resolveProgressCache(noStore, [
          STRAPI_TAGS.activities,
          STRAPI_TAGS.subTasks,
        ]),
      },
      {
        fields: ["action", "timestamp"],
        filters: {
          subTask: { documentId: { $in: producingSubTaskIds } },
          action: { $in: ["started", "stoped"] },
        },
        populate: {
          subTask: { fields: ["documentId"] },
          colaborator: { fields: ["documentId"] },
        },
        sort: "timestamp:asc",
        pagination: { pageSize: ACTIVITY_PAGE_SIZE },
      },
    );

    applyOpenActivities(
      activitiesRes.data,
      taskIdByProducingSubTask,
      progressByTaskId,
      badgesByTaskId,
    );
  }

  await applyFinishedParticipantCountsStrapi(
    finishedTaskIds,
    badgesByTaskId,
    noStore,
  );

  return { progressByTaskId, badgesByTaskId, assignedCountByColaboratorId };
}
