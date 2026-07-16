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
}

interface ActivityProgressEntity {
  action: "started" | "stoped";
  timestamp?: string | null;
  subTask?: { documentId?: string } | null;
  colaborator?: { documentId?: string } | null;
}

const PROGRESS_REVALIDATE_SEC = 15;
const SUBTASK_PAGE_SIZE = 500;
const ACTIVITY_PAGE_SIZE = 1000;
const FINISHED_STATUS = "finished";
const DISABLED_ACTIVATION = "disabled";

function emptyProgress(): BoardTaskProgressInput {
  return { subTasks: [], openActivityStartedAts: [] };
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
 * Loads live remaining inputs for producing/paused board tasks.
 * Finished tasks use persisted totals only (no fetch here).
 * Relies on Task.totalExpectedTime / totalTimeSpent for the bar fill.
 */
export async function loadBoardProgressByTaskId(
  tasks: ReadonlyArray<{ documentId: string; status: KanbanProgressStatus }>,
  options?: { noStore?: boolean },
): Promise<Record<string, BoardTaskProgressInput>> {
  const noStore = options?.noStore === true;
  const taskIds = tasks
    .filter((task) => needsLiveBoardProgress(task.status))
    .map((task) => task.documentId);

  const result: Record<string, BoardTaskProgressInput> = {};
  for (const taskId of taskIds) {
    result[taskId] = emptyProgress();
  }
  if (taskIds.length === 0) return result;

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
        task: { documentId: { $in: taskIds } },
        status: { $ne: FINISHED_STATUS },
        activationStatus: { $ne: DISABLED_ACTIVATION },
      },
      populate: { task: { fields: ["documentId"] } },
      pagination: { pageSize: SUBTASK_PAGE_SIZE },
    },
  );

  const producingSubTaskIds: string[] = [];
  const taskIdByProducingSubTask = new Map<string, string>();

  for (const subTask of subTasksRes.data) {
    const taskDocumentId = subTask.task?.documentId;
    if (!taskDocumentId || !result[taskDocumentId]) continue;

    result[taskDocumentId].subTasks.push({
      status: subTask.status,
      activationStatus: subTask.activationStatus ?? null,
      expectedTime: subTask.expectedTime ?? 0,
      timeSpent: subTask.timeSpent ?? 0,
    });

    if (subTask.status === "producing") {
      producingSubTaskIds.push(subTask.documentId);
      taskIdByProducingSubTask.set(subTask.documentId, taskDocumentId);
    }
  }

  if (producingSubTaskIds.length === 0) return result;

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
    const progress = result[taskDocumentId];
    if (!progress) continue;
    progress.openActivityStartedAts = listOpenActivityStartedAts(
      toActivitySessionRefs(activities),
    );
  }

  return result;
}
