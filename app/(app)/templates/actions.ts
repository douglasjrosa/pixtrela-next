"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { loadRibermaxTemplateFromBoxCode } from "@/integrations/ribermax";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTemplates,
  canDeleteTemplates,
  canManageTemplates,
} from "@/lib/auth/permissions";
import {
  createTemplateTask as createTemplateTaskRepo,
  deleteTemplateTask as deleteTemplateTaskRepo,
  findTemplateById,
  hardDeleteTemplateTask,
  updateTemplateTask as updateTemplateTaskRepo,
} from "@/lib/repos/templates";
import { templateListFiltersSchema } from "@/lib/schemas/template-list-filters";
import {
  bulkTemplateIdsSchema,
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

async function assertCanDeactivate(): Promise<void> {
  const session = await auth();
  if (!canDeactivateTemplates(session?.user?.role as Role | undefined)) {
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
    linkedToPrevious: row.linkedToPrevious ?? false,
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
  const draft = await loadRibermaxTemplateFromBoxCode(code);
  await updateTemplate(documentId, draft);
}

export async function deleteTemplate(documentId: string): Promise<void> {
  await assertCanManage();
  await deleteTemplateTaskRepo(documentId);
  invalidateTemplates();
}

export async function bulkArchiveTemplates(
  documentIds: string[],
): Promise<void> {
  await assertCanDeactivate();
  const ids = bulkTemplateIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const template = await findTemplateById(documentId);
    if (!template) throw new Error("notFound");
    await deleteTemplateTaskRepo(documentId);
  }
  invalidateTemplates();
}

export async function bulkDeleteTemplates(
  documentIds: string[],
): Promise<void> {
  await assertCanManage();
  const session = await auth();
  if (!canDeleteTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
  const ids = bulkTemplateIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const template = await findTemplateById(documentId);
    if (!template) throw new Error("notFound");
    if (template.active) throw new Error("activeTemplate");
    await hardDeleteTemplateTask(documentId);
  }
  invalidateTemplates();
}
