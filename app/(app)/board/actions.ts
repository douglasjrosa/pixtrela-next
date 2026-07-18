"use server";

import { createSubTask, updateSubTask } from "@/app/(app)/tasks/[documentId]/actions";
import { auth } from "@/auth";
import type { BoardSubTaskSummary } from "@/components/kanban/types";
import {
  appendSubtaskToTemplateComponents,
  mapDependencyIdsToTemplateIndexes,
} from "@/lib/business/append-subtask-to-template";
import { parseSubTaskDependencyIds } from "@/lib/business/subtask-dependencies";
import type { Role } from "@/lib/auth/nav";
import {
  canManageTasks,
  canManageTemplates,
  canMoveBoardTasks,
} from "@/lib/auth/permissions";
import { loadBoardProgressByTaskId } from "@/lib/board/load-board-progress";
import type { BoardProgressPollSnapshot } from "@/lib/board/progress-poll";
import {
  listActivitySessions,
  listOpenActivityStartedAts,
  type ActivitySessionRef,
  type KanbanProgressStatus,
} from "@/lib/business/task-progress";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

interface StrapiList<T> {
  data: T[];
}

interface IdEntity {
  documentId: string;
}

interface BoardSubTaskEntity {
  documentId: string;
  name: string;
  status: BoardSubTaskSummary["status"];
  sharingType?: "qty" | "duration";
  expectedTime?: number;
  timeSpent?: number;
  assignedTo?: { documentId: string; name?: string }[] | null;
}

interface BoardActivityEntity {
  action: "started" | "stoped";
  timestamp?: string | null;
  qty?: number | null;
  subTask?: { documentId?: string } | null;
  colaborator?: { documentId?: string; name?: string | null } | null;
}

interface SubTaskEntity {
  documentId: string;
  name: string;
  qty: number;
  expectedTime: number;
  sharingType: SubTaskFormInput["sharingType"];
  maxSameTimeWorkers: number;
  status: SubTaskFormInput["status"];
  activationStatus?: SubTaskFormInput["activationStatus"];
  reasonForDisabling?: string | null;
  dependencies?: unknown;
  assignedTo?: { documentId: string }[] | null;
}

async function assertCanMove(): Promise<void> {
  const session = await auth();
  if (!canMoveBoardTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanManageBoardSubtasks(): Promise<void> {
  const session = await auth();
  if (!canManageTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

export async function pollBoardProgress(
  tasks: ReadonlyArray<{ documentId: string; status: KanbanProgressStatus }>,
): Promise<BoardProgressPollSnapshot> {
  const session = await auth();
  if (!session?.jwt) {
    throw new Error("unauthorized");
  }

  const { progressByTaskId, badgesByTaskId, assignedCountByColaboratorId } =
    await loadBoardProgressByTaskId(tasks, { noStore: true });

  const documentIds = tasks.map((task) => task.documentId);
  const totalsByTaskId: BoardProgressPollSnapshot["totalsByTaskId"] = {};

  if (documentIds.length > 0) {
    const tasksRes = await strapiFetch<
      StrapiList<{
        documentId: string;
        totalTimeSpent?: number;
        totalExpectedTime?: number;
      }>
    >(
      "/tasks",
      { strapiCache: { noStore: true } },
      {
        fields: ["documentId", "totalTimeSpent", "totalExpectedTime"],
        filters: { documentId: { $in: documentIds } },
        pagination: { pageSize: 200 },
      },
    );

    for (const task of tasksRes.data) {
      totalsByTaskId[task.documentId] = {
        totalTimeSpent: task.totalTimeSpent ?? 0,
        totalExpectedTime: task.totalExpectedTime ?? 0,
      };
    }
  }

  return {
    progressByTaskId,
    badgesByTaskId,
    assignedCountByColaboratorId,
    totalsByTaskId,
    nowMs: Date.now(),
  };
}

export async function loadBoardSubtasks(
  taskDocumentId: string,
): Promise<BoardSubTaskSummary[]> {
  await assertCanManageBoardSubtasks();

  const res = await strapiFetch<StrapiList<BoardSubTaskEntity>>(
    "/sub-tasks",
    { strapiCache: { noStore: true } },
    {
      fields: [
        "documentId",
        "name",
        "status",
        "sharingType",
        "expectedTime",
        "timeSpent",
      ],
      filters: { task: { documentId: { $eq: taskDocumentId } } },
      populate: { assignedTo: { fields: ["documentId", "name"] } },
      sort: "index:asc",
      pagination: { pageSize: 100 },
    },
  );

  const subTaskIds = res.data.map((subtask) => subtask.documentId);
  const activitiesBySubTask = new Map<string, ActivitySessionRef[]>();

  if (subTaskIds.length > 0) {
    const activitiesRes = await strapiFetch<StrapiList<BoardActivityEntity>>(
      "/activities",
      { strapiCache: { noStore: true } },
      {
        fields: ["action", "timestamp", "qty"],
        filters: {
          subTask: { documentId: { $in: subTaskIds } },
          action: { $in: ["started", "stoped"] },
        },
        populate: {
          subTask: { fields: ["documentId"] },
          colaborator: { fields: ["documentId", "name"] },
        },
        sort: "timestamp:asc",
        pagination: { pageSize: 1000 },
      },
    );

    for (const activity of activitiesRes.data) {
      const subTaskDocumentId = activity.subTask?.documentId;
      const colaboratorDocumentId = activity.colaborator?.documentId;
      const timestamp = activity.timestamp;
      if (!subTaskDocumentId || !colaboratorDocumentId || !timestamp) continue;
      const list = activitiesBySubTask.get(subTaskDocumentId) ?? [];
      list.push({
        subTaskDocumentId,
        colaboratorDocumentId,
        colaboratorName: activity.colaborator?.name ?? "",
        action: activity.action,
        timestamp,
        qty: Number(activity.qty ?? 0),
      });
      activitiesBySubTask.set(subTaskDocumentId, list);
    }
  }

  return res.data.map((subtask) => {
    const activityRefs = activitiesBySubTask.get(subtask.documentId) ?? [];
    return {
      documentId: subtask.documentId,
      name: subtask.name,
      status: subtask.status,
      sharingType: subtask.sharingType === "qty" ? "qty" : "duration",
      expectedTime: subtask.expectedTime ?? 0,
      timeSpent: subtask.timeSpent ?? 0,
      openActivityStartedAts: listOpenActivityStartedAts(activityRefs),
      sessions: listActivitySessions(activityRefs),
      assignedTo:
        subtask.assignedTo?.map((user) => ({
          documentId: user.documentId,
          name: user.name ?? "",
        })) ?? [],
    };
  });
}

async function fetchSubTaskForUpdate(
  documentId: string,
): Promise<SubTaskEntity | null> {
  try {
    const res = await strapiFetch<{ data: SubTaskEntity }>(
      `/sub-tasks/${documentId}`,
      { strapiCache: { noStore: true } },
      {
        fields: [
          "documentId",
          "name",
          "qty",
          "expectedTime",
          "sharingType",
          "maxSameTimeWorkers",
          "status",
          "activationStatus",
          "reasonForDisabling",
          "dependencies",
        ],
        populate: { assignedTo: { fields: ["documentId"] } },
      },
    );
    return res.data;
  } catch {
    return null;
  }
}

function toSubTaskFormInput(
  subtask: SubTaskEntity,
  assignedToIds: string[],
): SubTaskFormInput {
  return {
    name: subtask.name,
    qty: subtask.qty,
    expectedTime: subtask.expectedTime,
    sharingType: subtask.sharingType ?? "duration",
    maxSameTimeWorkers: subtask.maxSameTimeWorkers ?? 1,
    status: subtask.status,
    activationStatus: subtask.activationStatus ?? "locked",
    reasonForDisabling: subtask.reasonForDisabling ?? "",
    dependencyIds: parseSubTaskDependencyIds(subtask.dependencies),
    assignedToIds,
  };
}

export async function createBoardSubtask(
  taskDocumentId: string,
  values: SubTaskFormInput,
  options?: { addToTemplate?: boolean },
): Promise<void> {
  await assertCanManageBoardSubtasks();

  await createSubTask(taskDocumentId, values);

  if (options?.addToTemplate) {
    await appendBoardSubtaskToTaskTemplate(taskDocumentId, values);
  }
}

async function fetchTaskTemplateCode(
  taskDocumentId: string,
): Promise<string | null> {
  const res = await strapiFetch<{ data: { templateTaskCode?: string | null } }>(
    `/tasks/${taskDocumentId}`,
    { strapiCache: { noStore: true } },
    { fields: ["templateTaskCode"] },
  );
  const code = res.data.templateTaskCode?.trim();
  return code ? code : null;
}

async function fetchTemplateByCode(code: string): Promise<{
  documentId: string;
  name: string;
  code: string;
  subTask: TemplateSubTaskComponentInput[];
} | null> {
  const res = await strapiFetch<
    StrapiList<{
      documentId: string;
      name: string;
      code: string;
      subTask?: TemplateSubTaskComponentInput[] | null;
    }>
  >(
    "/template-tasks",
    { strapiCache: { noStore: true } },
    {
      fields: ["documentId", "name", "code"],
      filters: { code: { $eq: code } },
      populate: { subTask: true },
      pagination: { pageSize: 1 },
    },
  );

  const template = res.data[0];
  if (!template) return null;

  return {
    documentId: template.documentId,
    name: template.name,
    code: template.code,
    subTask: template.subTask ?? [],
  };
}

async function fetchTaskSubtaskRefs(
  taskDocumentId: string,
): Promise<{ documentId: string; name: string }[]> {
  const res = await strapiFetch<
    StrapiList<{ documentId: string; name: string }>
  >(
    "/sub-tasks",
    { strapiCache: { noStore: true } },
    {
      fields: ["documentId", "name"],
      filters: { task: { documentId: { $eq: taskDocumentId } } },
      sort: "index:asc",
      pagination: { pageSize: 100 },
    },
  );
  return res.data;
}

async function appendBoardSubtaskToTaskTemplate(
  taskDocumentId: string,
  values: SubTaskFormInput,
): Promise<void> {
  const session = await auth();
  if (!canManageTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }

  const templateCode = await fetchTaskTemplateCode(taskDocumentId);
  if (!templateCode) {
    throw new Error("no_template");
  }

  const template = await fetchTemplateByCode(templateCode);
  if (!template) {
    throw new Error("template_not_found");
  }

  const taskSubtasks = await fetchTaskSubtaskRefs(taskDocumentId);
  const dependencyIndexes = mapDependencyIdsToTemplateIndexes(
    values.dependencyIds ?? [],
    taskSubtasks,
    template.subTask.map((row) => row.name),
  );
  const nextSubTasks = appendSubtaskToTemplateComponents(
    template.subTask,
    values,
    dependencyIndexes,
  );

  await strapiFetch(`/template-tasks/${template.documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({
      data: {
        name: template.name,
        code: template.code,
        subTask: nextSubTasks,
      },
    }),
  });

  revalidateStrapiTags(STRAPI_TAGS.templateTasks);
}

export async function updateBoardSubtaskAssignees(
  subtaskDocumentId: string,
  taskDocumentId: string,
  assignedToIds: string[],
): Promise<void> {
  await assertCanManageBoardSubtasks();

  const subtask = await fetchSubTaskForUpdate(subtaskDocumentId);
  if (!subtask) {
    throw new Error("notFound");
  }

  await updateSubTask(
    subtaskDocumentId,
    taskDocumentId,
    toSubTaskFormInput(subtask, assignedToIds),
  );
}

async function resolveDocumentId(
  path: string,
  numericId: number,
): Promise<string | null> {
  const res = await strapiFetch<StrapiList<IdEntity>>(
    path,
    { strapiCache: { noStore: true } },
    {
      fields: ["documentId"],
      filters: { id: { $eq: numericId } },
      pagination: { pageSize: 1 },
    },
  );
  return res.data[0]?.documentId ?? null;
}

export async function applyBoardTaskOrder(
  updates: { documentId: string; index: number; stepId: number | null }[],
): Promise<void> {
  if (updates.length === 0) return;
  await assertCanMove();

  for (const update of updates) {
    const data: { index: number; step?: string } = { index: update.index };
    if (update.stepId != null) {
      const stepDocumentId = await resolveDocumentId("/steps", update.stepId);
      if (!stepDocumentId) {
        throw new Error("notFound");
      }
      data.step = stepDocumentId;
    }

    await strapiFetch(`/tasks/${update.documentId}`, {
      method: "PUT",
      strapiCache: { noStore: true },
      body: JSON.stringify({ data }),
    });
  }

  revalidateStrapiTags(STRAPI_TAGS.tasks, STRAPI_TAGS.steps);
}

export async function moveTaskToStep(
  taskId: number,
  stepId: number,
): Promise<void> {
  await assertCanMove();

  const [taskDocumentId, stepDocumentId] = await Promise.all([
    resolveDocumentId("/tasks", taskId),
    resolveDocumentId("/steps", stepId),
  ]);

  if (!taskDocumentId || !stepDocumentId) {
    throw new Error("notFound");
  }

  await strapiFetch(`/tasks/${taskDocumentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: { step: stepDocumentId } }),
  });

  revalidateStrapiTags(STRAPI_TAGS.tasks, STRAPI_TAGS.steps);
}
