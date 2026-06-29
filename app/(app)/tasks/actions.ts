"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canDeleteTasks, canManageTasks } from "@/lib/auth/permissions";
import { getNextTaskIndex } from "@/lib/business/task-order";
import { taskFormSchema, type TaskFormInput } from "@/lib/schemas/task";
import { strapiFetch } from "@/lib/strapi";
import { LIST_CACHE_CONTRACT } from "@/lib/strapi/list-cache-contract";
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

function toStrapiPayload(input: TaskFormInput, index: number, active = true) {
  const base = {
    name: input.name,
    qty: input.qty,
    deliveryDate: input.deliveryDate || null,
    index,
    status: input.status,
    templateTaskCode: input.templateTaskCode || null,
    active,
  };
  return { ...base, step: input.stepDocumentId };
}

function invalidateTasks(taskDocumentId?: string): void {
  const { tags, paths } = LIST_CACHE_CONTRACT.tasks;
  const detailPaths = taskDocumentId ? [`/tasks/${taskDocumentId}`] : [];
  revalidateStrapiTags(...tags, { paths: [...paths, ...detailPaths] });
}

async function fetchTaskIndexes(): Promise<number[]> {
  const res = await strapiFetch<StrapiList<{ index: number }>>(
    "/tasks",
    { strapiCache: { noStore: true } },
    {
      fields: ["index"],
      filters: { active: { $eq: true } },
      pagination: { pageSize: 100 },
    },
  );
  return res.data.map((task) => task.index);
}

async function fetchTaskIndex(documentId: string): Promise<number> {
  const res = await strapiFetch<{ data: { index: number } }>(
    `/tasks/${documentId}`,
    { strapiCache: { noStore: true } },
    { fields: ["index"] },
  );
  return res.data.index;
}

export async function createTask(raw: TaskFormInput): Promise<void> {
  await assertCanManage();
  const data = taskFormSchema.parse(raw);
  const indexes = await fetchTaskIndexes();
  const index = getNextTaskIndex(indexes.map((value) => ({ index: value })));
  await strapiFetch("/tasks", {
    method: "POST",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data, index) }),
  });
  invalidateTasks();
}

export async function updateTask(
  documentId: string,
  raw: TaskFormInput,
): Promise<void> {
  await assertCanManage();
  const data = taskFormSchema.parse(raw);
  const index = await fetchTaskIndex(documentId);
  await strapiFetch(`/tasks/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data, index) }),
  });
  invalidateTasks(documentId);
}

export async function deactivateTask(documentId: string): Promise<void> {
  await assertCanManage();
  await strapiFetch(`/tasks/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: { active: false } }),
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

  const res = await strapiFetch<StrapiList<{ name: string }>>(
    "/template-tasks",
    { strapiCache: { noStore: true } },
    {
      fields: ["name"],
      filters: { code: { $eq: trimmed } },
      pagination: { pageSize: 1 },
    },
  );

  const template = res.data[0];
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
  await strapiFetch(`/tasks/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateTasks();
}
