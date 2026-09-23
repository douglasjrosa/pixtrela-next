"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTasks,
  canDeleteTasks,
  canManageTasks,
} from "@/lib/auth/permissions";
import { getNextTaskIndex } from "@/lib/business/task-order";
import { auditSuccess } from "@/lib/logs/record-log";
import { applyAutoStepTaskOrderingAfterTaskChange } from "@/lib/business/apply-step-task-order";
import { findTemplateByCode } from "@/lib/repos/templates";
import {
  archiveTasks,
  createTask as createTaskRepo,
  deleteTaskById,
  getTaskById,
  listTasks as listTasksRepo,
  setTaskActive,
  updateTaskFields,
} from "@/lib/repos/tasks";
import { parseArchiveReason } from "@/lib/schemas/archive-with-reason";
import {
  bulkTaskIdsSchema,
  taskFormSchema,
  type TaskFormInput,
} from "@/lib/schemas/task";
import { taskListFiltersSchema } from "@/lib/schemas/task-list-filters";
import {
  loadTaskListPage,
  type TaskListPageResult,
} from "@/lib/tasks/load-task-list-page";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanDeactivate(): Promise<void> {
  const session = await auth();
  if (!canDeactivateTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateTasks(): void {
  revalidateTag("drizzle:tasks", "default");
}

async function fetchTaskIndexes(): Promise<number[]> {
  const rows = await listTasksRepo();
  return rows.map((task) => task.index);
}

async function fetchTaskIndex(documentId: string): Promise<number> {
  const task = await getTaskById(documentId);
  if (!task) throw new Error("notFound");
  return task.index;
}

export async function loadMoreTasks(
  rawFilters: unknown,
  page: number,
): Promise<TaskListPageResult> {
  await assertCanManage();
  const filters = taskListFiltersSchema.parse(rawFilters);
  return loadTaskListPage(filters, page);
}

export async function createTask(raw: TaskFormInput): Promise<void> {
  await assertCanManage();
  const data = taskFormSchema.parse(raw);
  const indexes = await fetchTaskIndexes();
  const index = getNextTaskIndex(indexes.map((value) => ({ index: value })));

  await createTaskRepo({
    name: data.name,
    qty: data.qty,
    deliveryDate: data.deliveryDate || null,
    stepId: data.stepDocumentId || null,
    status: data.status,
    templateTaskCode: data.templateTaskCode || null,
    index,
  });
  if (data.stepDocumentId) {
    await applyAutoStepTaskOrderingAfterTaskChange({
      after: {
        stepId: data.stepDocumentId,
        deliveryDate: data.deliveryDate || null,
      },
    });
  }
  await auditSuccess({
    route: "/tasks",
    verb: "created",
    entity: "task",
    name: data.name,
    code: data.templateTaskCode,
  });
  invalidateTasks();
}

export async function updateTask(
  documentId: string,
  raw: TaskFormInput,
): Promise<void> {
  await assertCanManage();
  const data = taskFormSchema.parse(raw);
  await fetchTaskIndex(documentId);
  // Omit step so status→step automation owns the board column (hidden form
  // stepDocumentId would otherwise overwrite the mapped step after update).
  const before = await getTaskById(documentId);
  await updateTaskFields(documentId, {
    name: data.name,
    qty: data.qty,
    deliveryDate: data.deliveryDate || null,
    status: data.status,
    templateTaskCode: data.templateTaskCode || null,
  });
  if (before) {
    await applyAutoStepTaskOrderingAfterTaskChange({
      before: {
        stepId: before.stepId,
        deliveryDate: before.deliveryDate,
      },
      after: {
        stepId: before.stepId,
        deliveryDate: data.deliveryDate || null,
      },
    });
  }
  await auditSuccess({
    route: "/tasks",
    verb: "updated",
    entity: "task",
    name: data.name,
    code: data.templateTaskCode,
    before: before ? `${before.name} / ${before.status}` : null,
    after: `${data.name} / ${data.status}`,
  });
  invalidateTasks();
}

export async function deactivateTask(
  documentId: string,
  reason: string,
): Promise<void> {
  await assertCanDeactivate();
  const text = parseArchiveReason(reason, 1);
  const task = await getTaskById(documentId);
  await archiveTasks([documentId], text);
  await auditSuccess({
    route: "/tasks",
    verb: "archived",
    entity: "task",
    name: task?.name,
    code: task?.templateTaskCode,
  });
  invalidateTasks();
}

export async function reactivateTask(documentId: string): Promise<void> {
  await assertCanDeactivate();
  const task = await getTaskById(documentId);
  await setTaskActive(documentId, true);
  await auditSuccess({
    route: "/tasks",
    verb: "reactivated",
    entity: "task",
    name: task?.name,
    code: task?.templateTaskCode,
  });
  invalidateTasks();
}

export async function lookupTemplateNameByCode(
  code: string,
): Promise<{ name: string }> {
  await assertCanManage();
  const trimmed = code.trim();
  if (!trimmed) {
    throw new Error("missingCode");
  }

  const template = await findTemplateByCode(trimmed);
  if (!template) {
    throw new Error("not_found");
  }

  return { name: template.name };
}

export async function deleteTask(documentId: string): Promise<void> {
  await assertCanManage();
  const session = await auth();
  if (!canDeleteTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
  const task = await getTaskById(documentId);
  await deleteTaskById(documentId);
  await auditSuccess({
    route: "/tasks",
    verb: "deleted",
    entity: "task",
    name: task?.name,
    code: task?.templateTaskCode,
  });
  invalidateTasks();
}

export async function bulkDeactivateTasks(
  documentIds: string[],
  reason: string,
): Promise<void> {
  await assertCanDeactivate();
  const ids = bulkTaskIdsSchema.parse(documentIds);
  const text = parseArchiveReason(reason, ids.length);

  for (const documentId of ids) {
    const task = await getTaskById(documentId);
    if (!task) throw new Error("notFound");
  }
  await archiveTasks(ids, text);
  await auditSuccess({
    route: "/tasks",
    verb: "bulkArchived",
    entity: "tasks",
    quantity: ids.length,
  });
  invalidateTasks();
}

export async function bulkDeleteTasks(documentIds: string[]): Promise<void> {
  await assertCanManage();
  const session = await auth();
  if (!canDeleteTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
  const ids = bulkTaskIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const task = await getTaskById(documentId);
    if (!task) throw new Error("notFound");
    if (task.active) throw new Error("activeTask");
    await deleteTaskById(documentId);
  }
  await auditSuccess({
    route: "/tasks",
    verb: "bulkDeleted",
    entity: "tasks",
    quantity: ids.length,
  });
  invalidateTasks();
}
