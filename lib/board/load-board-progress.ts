import {
  countAssignedSubTasksByColaborator,
} from "@/lib/business/assign-warn";
import {
  countOpenColaborators,
  countUnassignedSubTasks,
} from "@/lib/business/kanban-card-badges";
import {
  listOpenActivityStartedAts,
  needsLiveBoardProgress,
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
  subTask?: { documentId?: string } | null;
  colaborator?: { documentId?: string } | null;
}

export type BoardCardBadges = {
  activeColaboratorCount: number;
  unassignedSubTaskCount: number;
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
  return { activeColaboratorCount: 0, unassignedSubTaskCount: 0 };
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

/**
 * Loads live progress for producing/paused tasks and card badge counts for all.
 * Finished tasks use persisted totals only for the bar (no progress rows here).
 */
export async function loadBoardProgressByTaskId(
  tasks: ReadonlyArray<{ documentId: string; status: KanbanProgressStatus }>,
  options?: { noStore?: boolean },
): Promise<BoardProgressLoadResult> {
  const noStore = options?.noStore === true;
  const allTaskIds = tasks.map((task) => task.documentId);
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
    if (liveTaskIds.has(taskId)) {
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

  if (producingSubTaskIds.length === 0) {
    return { progressByTaskId, badgesByTaskId, assignedCountByColaboratorId };
  }

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

  return { progressByTaskId, badgesByTaskId, assignedCountByColaboratorId };
}
