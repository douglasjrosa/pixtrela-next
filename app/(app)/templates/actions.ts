"use server";

import { auth } from "@/auth";
import { buildTemplateFromBox } from "@/lib/business/template-from-box";
import { fetchBoxTemplateData } from "@/lib/legacy/rbx-client";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";
import {
  templateTaskFormSchema,
  type TemplateSubTaskComponentInput,
  type TemplateTaskFormInput,
} from "@/lib/schemas/template-task";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

interface StrapiOne<T> {
  data: T;
}

interface TemplateEntity {
  documentId: string;
  name: string;
  code: string;
  subTask?: TemplateSubTaskComponentInput[] | null;
}

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
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

function invalidateTemplates(): void {
  revalidateStrapiTags(STRAPI_TAGS.templateTasks);
}

async function fetchTemplateEntity(
  documentId: string,
): Promise<TemplateEntity | null> {
  try {
    const res = await strapiFetch<StrapiOne<TemplateEntity>>(
      `/template-tasks/${documentId}`,
      { strapiCache: { noStore: true } },
      {
        fields: ["documentId", "name", "code"],
        populate: { subTask: true },
      },
    );
    return res.data;
  } catch {
    return null;
  }
}

export async function createTemplate(
  raw: Pick<TemplateTaskFormInput, "name" | "code">,
): Promise<string> {
  await assertCanManage();
  const data = templateTaskFormSchema
    .pick({ name: true, code: true })
    .parse(raw);
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
  await strapiFetch(`/template-tasks/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data) }),
  });
  invalidateTemplates();
}

export async function updateTemplateMetadata(
  documentId: string,
  raw: Pick<TemplateTaskFormInput, "name" | "code">,
): Promise<void> {
  await assertCanManage();
  const metadata = templateTaskFormSchema
    .pick({ name: true, code: true })
    .parse(raw);
  const template = await fetchTemplateEntity(documentId);
  if (!template) throw new Error("not_found");

  await updateTemplate(documentId, {
    name: metadata.name,
    code: metadata.code,
    subTask: template.subTask ?? [],
  });
}

export async function saveTemplateSubtasks(
  documentId: string,
  subtasks: TemplateSubTaskComponentInput[],
): Promise<void> {
  await assertCanManage();
  const template = await fetchTemplateEntity(documentId);
  if (!template) throw new Error("not_found");

  await updateTemplate(documentId, {
    name: template.name,
    code: template.code,
    subTask: subtasks,
  });
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
  await strapiFetch(`/template-tasks/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateTemplates();
}
