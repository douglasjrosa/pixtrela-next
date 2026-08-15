"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { buildTemplateFromBox } from "@/lib/business/template-from-box";
import { fetchBoxTemplateData } from "@/lib/legacy/rbx-client";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";
import {
  createTemplateTask as createTemplateTaskRepo,
  deleteTemplateTask as deleteTemplateTaskRepo,
  updateTemplateTask as updateTemplateTaskRepo,
} from "@/lib/repos/templates";
import { templateListFiltersSchema } from "@/lib/schemas/template-list-filters";
import {
  templateTaskFormSchema,
  type TemplateSubTaskComponentInput,
  type TemplateTaskFormInput,
} from "@/lib/schemas/template-task";
import {
  loadTemplateListPage,
  type TemplateListPageResult,
} from "@/lib/templates/load-template-list-page";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function dependencyIndexesFrom(
  dependencies: TemplateSubTaskComponentInput["dependencies"],
): number[] {
  if (!Array.isArray(dependencies)) return [];
  return dependencies.filter((value): value is number => typeof value === "number");
}

function toRepoSubTasks(subTasks: TemplateSubTaskComponentInput[]) {
  return subTasks.map((row, index) => ({
    name: row.name,
    qty: row.qty,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    index,
    expectedTime: row.expectedTime,
    dependencyIndexes: dependencyIndexesFrom(row.dependencies),
  }));
}

function invalidateTemplates(): void {
  revalidateTag("drizzle:templates", "default");
}

export async function loadMoreTemplates(
  rawFilters: unknown,
  page: number,
): Promise<TemplateListPageResult> {
  await assertCanManage();
  const filters = templateListFiltersSchema.parse(rawFilters);
  return loadTemplateListPage(filters, page);
}

export async function createTemplate(
  raw: Pick<TemplateTaskFormInput, "name" | "code">,
): Promise<string> {
  await assertCanManage();
  const data = templateTaskFormSchema
    .pick({ name: true, code: true })
    .parse(raw);

  const created = await createTemplateTaskRepo({
    name: data.name,
    code: data.code,
    subTasks: [],
  });
  invalidateTemplates();
  return created.id;
}

export async function updateTemplate(
  documentId: string,
  raw: TemplateTaskFormInput,
): Promise<void> {
  await assertCanManage();
  const data = templateTaskFormSchema.parse(raw);

  await updateTemplateTaskRepo({
    id: documentId,
    name: data.name,
    code: data.code,
    subTasks: toRepoSubTasks(data.subTask ?? []),
  });
  invalidateTemplates();
}

export async function loadTemplateFromLegacy(
  documentId: string,
  code: string,
): Promise<void> {
  await assertCanManage();
  const boxId = Number(code.trim());
  if (!Number.isInteger(boxId) || boxId <= 0) {
    throw new Error("invalidCode");
  }
  const data = await fetchBoxTemplateData(boxId);
  const draft = buildTemplateFromBox(data);
  await updateTemplate(documentId, draft);
}

export async function deleteTemplate(documentId: string): Promise<void> {
  await assertCanManage();
  await deleteTemplateTaskRepo(documentId);
  invalidateTemplates();
}
