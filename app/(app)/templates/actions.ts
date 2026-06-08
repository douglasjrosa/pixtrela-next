"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canDeleteTasks, canManageTemplates } from "@/lib/auth/permissions";
import {
  templateTaskFormSchema,
  type TemplateTaskFormInput,
} from "@/lib/schemas/template-task";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

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
    subTask: (input.subTask ?? []).map((row) => ({
      name: row.name,
      qty: row.qty,
      sharingType: row.sharingType,
      maxSameTimeWorkers: row.maxSameTimeWorkers,
      index: row.index,
      expectedTime: row.expectedTime,
      dependencies: row.dependencies ?? null,
    })),
  };
}

function invalidateTemplates(): void {
  revalidateStrapiTags(STRAPI_TAGS.templateTasks);
}

export async function createTemplate(raw: TemplateTaskFormInput): Promise<void> {
  await assertCanManage();
  const data = templateTaskFormSchema.parse(raw);
  await strapiFetch("/template-tasks", {
    method: "POST",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data) }),
  });
  invalidateTemplates();
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

export async function deleteTemplate(documentId: string): Promise<void> {
  await assertCanManage();
  const session = await auth();
  if (!canDeleteTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
  await strapiFetch(`/template-tasks/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateTemplates();
}
