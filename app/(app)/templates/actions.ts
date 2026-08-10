"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { buildTemplateFromBox } from "@/lib/business/template-from-box";
import { fetchBoxTemplateData } from "@/lib/legacy/rbx-client";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";
import { isDrizzleBackend } from "@/lib/db/backend";
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
import { strapiFetch } from "@/lib/strapi";
import { LIST_CACHE_CONTRACT } from "@/lib/strapi/list-cache-contract";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";
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

function toStrapiPayload(input: TemplateTaskFormInput) {
  return {
    name: input.name,
    code: input.code,
    subTask: (input.subTask ?? []).map((row, index) => ({
      name: row.name,
      qty: row.qty,
      sharingType: row.sharingType,
      maxSameTimeWorkers: row.maxSameTimeWorkers,
      index,
      expectedTime: row.expectedTime,
      dependencies: row.dependencies ?? null,
    })),
  };
}

function invalidateTemplates(templateDocumentId?: string): void {
  if (isDrizzleBackend()) {
    revalidateTag("drizzle:templates", "default");
    return;
  }
  const { tags, paths } = LIST_CACHE_CONTRACT.templateTasks;
  const detailPaths = templateDocumentId
    ? [`/templates/tasks/${templateDocumentId}`]
    : [];
  revalidateStrapiTags(...tags, { paths: [...paths, ...detailPaths] });
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

  if (isDrizzleBackend()) {
    const created = await createTemplateTaskRepo({
      name: data.name,
      code: data.code,
      subTasks: [],
    });
    invalidateTemplates();
    return created.id;
  }

  const res = await strapiFetch<{ data: { documentId: string } }>(
    "/template-tasks",
    {
      method: "POST",
      strapiCache: { noStore: true },
      body: JSON.stringify({
        data: { ...data, subTask: [] },
      }),
    },
  );
  invalidateTemplates();
  return res.data.documentId;
}

export async function updateTemplate(
  documentId: string,
  raw: TemplateTaskFormInput,
): Promise<void> {
  await assertCanManage();
  const data = templateTaskFormSchema.parse(raw);

  if (isDrizzleBackend()) {
    await updateTemplateTaskRepo({
      id: documentId,
      name: data.name,
      code: data.code,
      subTasks: toRepoSubTasks(data.subTask ?? []),
    });
    invalidateTemplates(documentId);
    return;
  }

  await strapiFetch(`/template-tasks/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data) }),
  });
  invalidateTemplates(documentId);
}

/**
 * Loads a legacy box template and persists it on the given template record.
 */
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

  if (isDrizzleBackend()) {
    await deleteTemplateTaskRepo(documentId);
    invalidateTemplates(documentId);
    return;
  }

  await strapiFetch(`/template-tasks/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateTemplates(documentId);
}
