"use server";

import { auth } from "@/auth";
import { getNextSubTaskIndex, buildSubTaskIndexUpdates } from "@/lib/business/subtask-order";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks } from "@/lib/auth/permissions";
import {
  subTaskFormSchema,
  type SubTaskFormInput,
} from "@/lib/schemas/sub-task";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

interface StrapiList<T> {
  data: T[];
}

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function toStrapiPayload(
  input: SubTaskFormInput,
  taskDocumentId: string,
  index: number,
) {
  return {
    name: input.name,
    qty: input.qty,
    index,
    expectedTime: input.expectedTime,
    sharingType: input.sharingType,
    maxSameTimeWorkers: input.maxSameTimeWorkers,
    status: input.status,
    activationStatus: input.activationStatus ?? "locked",
    reasonForDisabling:
      input.activationStatus === "disabled"
        ? input.reasonForDisabling?.trim()
        : null,
    dependencies: input.dependencyIds ?? [],
    task: taskDocumentId,
    assignedTo: input.assignedToIds ?? [],
  };
}

function invalidateSubTasks(): void {
  revalidateStrapiTags(STRAPI_TAGS.subTasks, STRAPI_TAGS.tasks);
}

interface SubTaskEntity {
  documentId: string;
  name: string;
  qty: number;
  index: number;
  expectedTime: number;
  sharingType: SubTaskFormInput["sharingType"];
  maxSameTimeWorkers: number;
  status: SubTaskFormInput["status"];
  activationStatus?: SubTaskFormInput["activationStatus"];
  reasonForDisabling?: string | null;
  dependencies?: unknown;
  assignedTo?: { documentId: string }[] | null;
}

async function fetchSubTasksForTask(
  taskDocumentId: string,
): Promise<SubTaskEntity[]> {
  const res = await strapiFetch<StrapiList<SubTaskEntity>>(
    "/sub-tasks",
    { strapiCache: { noStore: true } },
    {
      fields: [
        "documentId",
        "name",
        "qty",
        "index",
        "expectedTime",
        "sharingType",
        "maxSameTimeWorkers",
        "status",
        "activationStatus",
        "reasonForDisabling",
        "dependencies",
      ],
      filters: { task: { documentId: { $eq: taskDocumentId } } },
      populate: { assignedTo: { fields: ["documentId"] } },
      sort: "index:asc",
      pagination: { pageSize: 100 },
    },
  );
  return res.data;
}

async function fetchSubTaskIndex(documentId: string): Promise<number> {
  const res = await strapiFetch<{ data: { index: number } }>(
    `/sub-tasks/${documentId}`,
    { strapiCache: { noStore: true } },
    { fields: ["index"] },
  );
  return res.data.index;
}

async function fetchSubTaskIds(taskDocumentId: string): Promise<string[]> {
  const res = await strapiFetch<StrapiList<{ documentId: string }>>(
    "/sub-tasks",
    { strapiCache: { noStore: true } },
    {
      fields: ["documentId"],
      filters: { task: { documentId: { $eq: taskDocumentId } } },
      pagination: { pageSize: 100 },
    },
  );
  return res.data.map((subtask) => subtask.documentId);
}

export async function createSubTask(
  taskDocumentId: string,
  raw: SubTaskFormInput,
  options?: { insertAtIndex?: number },
): Promise<void> {
  await assertCanManage();
  const data = subTaskFormSchema.parse(raw);
  const subtasks = await fetchSubTasksForTask(taskDocumentId);
  const indexes = subtasks.map((subtask) => subtask.index);
  const nextIndex = getNextSubTaskIndex(indexes.map((index) => ({ index })));

  const created = await strapiFetch<{ data: { documentId: string } }>(
    "/sub-tasks",
    {
      method: "POST",
      strapiCache: { noStore: true },
      body: JSON.stringify({
        data: toStrapiPayload(data, taskDocumentId, nextIndex),
      }),
    },
  );

  const insertAt = options?.insertAtIndex;
  if (insertAt !== undefined) {
    const orderedDocumentIds = [
      ...subtasks.slice(0, insertAt).map((subtask) => subtask.documentId),
      created.data.documentId,
      ...subtasks.slice(insertAt).map((subtask) => subtask.documentId),
    ];
    await reorderSubTasks(taskDocumentId, orderedDocumentIds);
    return;
  }

  invalidateSubTasks();
}

export async function updateSubTask(
  documentId: string,
  taskDocumentId: string,
  raw: SubTaskFormInput,
): Promise<void> {
  await assertCanManage();
  const data = subTaskFormSchema.parse(raw);
  const currentIndex = await fetchSubTaskIndex(documentId);
  await strapiFetch(`/sub-tasks/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({
      data: toStrapiPayload(data, taskDocumentId, currentIndex),
    }),
  });
  invalidateSubTasks();
}

export async function reorderSubTasks(
  taskDocumentId: string,
  orderedDocumentIds: string[],
): Promise<void> {
  await assertCanManage();

  const existingIds = await fetchSubTaskIds(taskDocumentId);
  const sortedExisting = [...existingIds].sort();
  const sortedOrdered = [...orderedDocumentIds].sort();
  const isValid =
    sortedExisting.length === sortedOrdered.length &&
    sortedExisting.every((id, index) => id === sortedOrdered[index]);

  if (!isValid) {
    throw new Error("invalid_reorder");
  }

  const updates = buildSubTaskIndexUpdates(orderedDocumentIds);
  for (const { documentId, index } of updates) {
    await strapiFetch(`/sub-tasks/${documentId}`, {
      method: "PUT",
      strapiCache: { noStore: true },
      body: JSON.stringify({ data: { index, task: taskDocumentId } }),
    });
  }
  invalidateSubTasks();
}

export async function deleteSubTask(documentId: string): Promise<void> {
  await assertCanManage();
  await strapiFetch(`/sub-tasks/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateSubTasks();
}
