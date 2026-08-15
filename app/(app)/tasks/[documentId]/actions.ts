"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { normalizeSubTaskCreateValues } from "@/lib/business/subtask-create-fields";
import { getNextSubTaskIndex, buildSubTaskIndexUpdates } from "@/lib/business/subtask-order";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks } from "@/lib/auth/permissions";
import { fromDrizzleActivationStatus } from "@/lib/domain/subtask-activation-map";
import {
  createSubTaskForTask,
  deleteSubTaskById,
  getSubTaskById,
  listSubTaskActivitySessions,
  listSubTaskIdsForTask,
  listSubTasksWithRelationsForTask,
  updateSubTaskFields,
  updateSubTaskIndex,
} from "@/lib/repos/tasks";
import {
  subTaskFormSchema,
  type SubTaskFormInput,
} from "@/lib/schemas/sub-task";
import type { ActivitySession } from "@/lib/business/task-progress";

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

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateSubTasks(): void {
  revalidateTag("drizzle:tasks", "default");
}

function mapDrizzleSubTaskToEntity(
  row: Awaited<ReturnType<typeof listSubTasksWithRelationsForTask>>[number],
): SubTaskEntity {
  return {
    documentId: row.id,
    name: row.name,
    qty: row.qty,
    index: row.index,
    expectedTime: row.expectedTime,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    status: row.status,
    activationStatus: fromDrizzleActivationStatus(row.activationStatus),
    reasonForDisabling: row.reasonForDeactivation,
    dependencies: row.dependencyIds,
    assignedTo: row.assignedToIds.map((documentId) => ({ documentId })),
  };
}

async function fetchSubTasksForTask(
  taskDocumentId: string,
): Promise<SubTaskEntity[]> {
  const rows = await listSubTasksWithRelationsForTask(taskDocumentId);
  return rows.map(mapDrizzleSubTaskToEntity);
}

async function fetchSubTaskIndex(documentId: string): Promise<number> {
  const subtask = await getSubTaskById(documentId);
  if (!subtask) throw new Error("notFound");
  return subtask.index;
}

async function fetchSubTaskIds(taskDocumentId: string): Promise<string[]> {
  return listSubTaskIdsForTask(taskDocumentId);
}

export async function createSubTask(
  taskDocumentId: string,
  raw: SubTaskFormInput,
  options?: { insertAtIndex?: number },
): Promise<void> {
  await assertCanManage();
  const subtasks = await fetchSubTasksForTask(taskDocumentId);
  const data = normalizeSubTaskCreateValues(
    subTaskFormSchema.parse(raw),
    subtasks.map((subtask) => ({
      documentId: subtask.documentId,
      status: subtask.status,
    })),
  );
  const indexes = subtasks.map((subtask) => subtask.index);
  const nextIndex = getNextSubTaskIndex(indexes.map((index) => ({ index })));

  const created = await createSubTaskForTask(taskDocumentId, data, nextIndex);
  const insertAt = options?.insertAtIndex;
  if (insertAt !== undefined) {
    const orderedDocumentIds = [
      ...subtasks.slice(0, insertAt).map((subtask) => subtask.documentId),
      created.id,
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
  await updateSubTaskFields(documentId, taskDocumentId, data, currentIndex);
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
    await updateSubTaskIndex(documentId, index, taskDocumentId);
  }
  invalidateSubTasks();
}

export async function deleteSubTask(documentId: string): Promise<void> {
  await assertCanManage();
  await deleteSubTaskById(documentId);
  invalidateSubTasks();
}

export async function loadSubTaskSessionsAction(
  subTaskDocumentId: string,
): Promise<ActivitySession[]> {
  await assertCanManage();
  return listSubTaskActivitySessions(subTaskDocumentId);
}
