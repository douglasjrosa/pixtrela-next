"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { loadRibermaxTemplateFromBoxCode } from "@/integrations/ribermax";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTemplates,
  canDeleteTemplates,
  canManageTemplates,
} from "@/lib/auth/permissions";
import {
  archiveTemplateTasks,
  createTemplateTask as createTemplateTaskRepo,
  deleteTemplateTask as deleteTemplateTaskRepo,
  findTemplateById,
  hardDeleteTemplateTask,
  updateTemplateTask as updateTemplateTaskRepo,
} from "@/lib/repos/templates";
import { auditSuccess } from "@/lib/logs/record-log";
import { parseArchiveReason } from "@/lib/schemas/archive-with-reason";
import { templateListFiltersSchema } from "@/lib/schemas/template-list-filters";
import {
  bulkTemplateIdsSchema,
  templateTaskFormSchema,
  type TemplateTaskFormInput,
} from "@/lib/schemas/template-task";
import {
  loadTemplateListPage,
  type TemplateListPageResult,
} from "@/lib/templates/load-template-list-page";
import { toTemplateRepoSubTasks } from "@/lib/templates/to-template-repo-subtasks";

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

function invalidateTemplates(): void {
  revalidateTag("drizzle:templates", "default");
  revalidatePath("/templates/tasks");
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
  await auditSuccess({
    route: "/templates/tasks",
    verb: "created",
    entity: "template",
    name: data.name,
    code: data.code,
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
    subTasks: toTemplateRepoSubTasks(data.subTask ?? []) ?? [],
  });
  await auditSuccess({
    route: "/templates/tasks",
    verb: "updated",
    entity: "template",
    name: data.name,
    code: data.code,
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

export async function deleteTemplate(
  documentId: string,
  reason: string,
): Promise<void> {
  await assertCanManage();
  const text = parseArchiveReason(reason, 1);
  const template = await findTemplateById(documentId);
  await deleteTemplateTaskRepo(documentId, text);
  await auditSuccess({
    route: "/templates/tasks",
    verb: "archived",
    entity: "template",
    name: template?.name,
    code: template?.code,
  });
  invalidateTemplates();
}

export async function bulkArchiveTemplates(
  documentIds: string[],
  reason: string,
): Promise<void> {
  await assertCanDeactivate();
  const ids = bulkTemplateIdsSchema.parse(documentIds);
  const text = parseArchiveReason(reason, ids.length);

  for (const documentId of ids) {
    const template = await findTemplateById(documentId);
    if (!template) throw new Error("notFound");
  }
  await archiveTemplateTasks(ids, text);
  await auditSuccess({
    route: "/templates/tasks",
    verb: "bulkArchived",
    entity: "templates",
    quantity: ids.length,
  });
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
  await auditSuccess({
    route: "/templates/tasks",
    verb: "bulkDeleted",
    entity: "templates",
    quantity: ids.length,
  });
  invalidateTemplates();
}
