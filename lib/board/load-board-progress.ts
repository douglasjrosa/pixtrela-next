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
  needsLiveBoardProgress,
  shouldShowKanbanTaskProgress,
  type BoardTaskProgressInput,
  type KanbanProgressStatus,
} from "@/lib/business/task-progress";
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

function toActivitySessionRefs(activities: ActivityProgressEntity[]) {
  return activities.flatMap((activity) => {
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

async function applyFinishedParticipantCounts(
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

  const idsByTask = new Map<string, string[]>();
  for (const activity of activitiesRes.data) {
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

/**
 * Loads progress rows for waiting/producing/paused tasks and card badge counts.
 * Open-session activity polling applies only to producing/paused (live) tasks.
 * Completed tasks use persisted totals only (no progress rows here).
 */
export async function loadBoardProgressByTaskId(
  tasks: ReadonlyArray<{ documentId: string; status: KanbanProgressStatus }>,
  options?: { noStore?: boolean },
): Promise<BoardProgressLoadResult> {
  const noStore = options?.noStore === true;
  const allTaskIds = tasks.map((task) => task.documentId);
  const finishedTaskIds = tasks
    .filter((task) => isCompletedTaskStatus(task.status))
    .map((task) => task.documentId);
  const progressTaskIds = new Set(
    tasks
      .filter((task) => shouldShowKanbanTaskProgress(task.status))
      .map((task) => task.documentId),
  );
  const liveTaskIds = new Set(
    tasks
      .filter((task) => needsLiveBoardProgress(task.status))
      .map((task) => task.documentId),
  );

  const progressByTaskId: Record<string, BoardTaskProgressInput> = {};
  const badgesByTaskId: Record<string, BoardCardBadges> = {};
  const assignedCountsByTask = new Map<string, number[]>();
  const assignedSubTaskInputs: { assignedToIds: string[] }[] = [];

  for (const taskId of allTaskIds) {
    badgesByTaskId[taskId] = emptyBadges();
    assignedCountsByTask.set(taskId, []);
    if (progressTaskIds.has(taskId)) {
      progressByTaskId[taskId] = emptyProgress();
    }
  }

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

  const producingSubTaskIds: string[] = [];
  const taskIdByProducingSubTask = new Map<string, string>();

  for (const subTask of subTasksRes.data) {
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

  const assignedCountByColaboratorId =
    countAssignedSubTasksByColaborator(assignedSubTaskInputs);

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

    const activitiesByTask = new Map<string, ActivityProgressEntity[]>();
    for (const activity of activitiesRes.data) {
      const subTaskDocumentId = activity.subTask?.documentId;
      if (!subTaskDocumentId) continue;
      const taskDocumentId = taskIdByProducingSubTask.get(subTaskDocumentId);
      if (!taskDocumentId) continue;
      const list = activitiesByTask.get(taskDocumentId) ?? [];
      list.push(activity);
      activitiesByTask.set(taskDocumentId, list);
    }

    for (const [taskDocumentId, activities] of activitiesByTask.entries()) {
      const refs = toActivitySessionRefs(activities);
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

  await applyFinishedParticipantCounts(
    finishedTaskIds,
    badgesByTaskId,
    noStore,
  );

  return { progressByTaskId, badgesByTaskId, assignedCountByColaboratorId };
}
