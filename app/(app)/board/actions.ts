"use server";

import { createSubTask, updateSubTask } from "@/app/(app)/tasks/[documentId]/actions";
import { auth } from "@/auth";
import type { BoardSubTaskSummary } from "@/components/kanban/types";
import { parseSubTaskDependencyIds } from "@/lib/business/subtask-dependencies";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks, canMoveBoardTasks } from "@/lib/auth/permissions";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
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
  assignedTo?: { documentId: string; name?: string }[] | null;
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

export async function loadBoardSubtasks(
  taskDocumentId: string,
): Promise<BoardSubTaskSummary[]> {
  await assertCanManageBoardSubtasks();

  const res = await strapiFetch<StrapiList<BoardSubTaskEntity>>(
    "/sub-tasks",
    { strapiCache: { noStore: true } },
    {
      fields: ["documentId", "name", "status"],
      filters: { task: { documentId: { $eq: taskDocumentId } } },
      populate: { assignedTo: { fields: ["documentId", "name"] } },
      sort: "index:asc",
      pagination: { pageSize: 100 },
    },
  );

  return res.data.map((subtask) => ({
    documentId: subtask.documentId,
    name: subtask.name,
    status: subtask.status,
    assignedTo:
      subtask.assignedTo?.map((user) => ({
        documentId: user.documentId,
        name: user.name ?? "",
      })) ?? [],
  }));
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
): Promise<void> {
  await assertCanManageBoardSubtasks();
  await createSubTask(taskDocumentId, values);
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
