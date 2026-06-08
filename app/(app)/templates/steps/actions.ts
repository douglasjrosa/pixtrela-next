"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canDeleteTasks, canManageSteps } from "@/lib/auth/permissions";
import { stepFormSchema, type StepFormInput } from "@/lib/schemas/step";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSteps(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateSteps(): void {
  revalidateStrapiTags(STRAPI_TAGS.steps);
}

export async function createStep(raw: StepFormInput): Promise<void> {
  await assertCanManage();
  const data = stepFormSchema.parse(raw);
  await strapiFetch("/steps", {
    method: "POST",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data }),
  });
  invalidateSteps();
}

export async function updateStep(
  documentId: string,
  raw: StepFormInput,
): Promise<void> {
  await assertCanManage();
  const data = stepFormSchema.parse(raw);
  await strapiFetch(`/steps/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data }),
  });
  invalidateSteps();
}

export async function deleteStep(documentId: string): Promise<void> {
  await assertCanManage();
  const session = await auth();
  if (!canDeleteTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
  await strapiFetch(`/steps/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateSteps();
}
