"use server";

import { auth } from "@/auth";
import {
  buildStepIndexUpdates,
  getNextStepIndex,
} from "@/lib/business/step-order";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import {
  stepNameFormSchema,
  type StepNameFormInput,
} from "@/lib/schemas/step";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

interface StrapiList<T> {
  data: T[];
}

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateSteps(): void {
  revalidateStrapiTags(STRAPI_TAGS.steps);
}

async function fetchStepIndexes(): Promise<number[]> {
  const res = await strapiFetch<StrapiList<{ index: number }>>(
    "/steps",
    { strapiCache: { noStore: true } },
    {
      fields: ["index"],
      pagination: { pageSize: 100 },
    },
  );
  return res.data.map((step) => step.index);
}

async function fetchStepIds(): Promise<string[]> {
  const res = await strapiFetch<StrapiList<{ documentId: string }>>(
    "/steps",
    { strapiCache: { noStore: true } },
    {
      fields: ["documentId"],
      pagination: { pageSize: 100 },
    },
  );
  return res.data.map((step) => step.documentId);
}

export async function createStep(raw: StepNameFormInput): Promise<void> {
  await assertCanManage();
  const { name } = stepNameFormSchema.parse(raw);
  const indexes = await fetchStepIndexes();
  const index = getNextStepIndex(indexes.map((value) => ({ index: value })));
  await strapiFetch("/steps", {
    method: "POST",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: { name, index } }),
  });
  invalidateSteps();
}

export async function updateStep(
  documentId: string,
  raw: StepNameFormInput,
): Promise<void> {
  await assertCanManage();
  const { name } = stepNameFormSchema.parse(raw);
  await strapiFetch(`/steps/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: { name } }),
  });
  invalidateSteps();
}

export async function reorderSteps(
  orderedDocumentIds: string[],
): Promise<void> {
  await assertCanManage();

  const existingIds = await fetchStepIds();
  const sortedExisting = [...existingIds].sort();
  const sortedOrdered = [...orderedDocumentIds].sort();
  const isValid =
    sortedExisting.length === sortedOrdered.length &&
    sortedExisting.every((id, position) => id === sortedOrdered[position]);

  if (!isValid) {
    throw new Error("invalid_reorder");
  }

  const updates = buildStepIndexUpdates(orderedDocumentIds);
  for (const { documentId, index } of updates) {
    await strapiFetch(`/steps/${documentId}`, {
      method: "PUT",
      strapiCache: { noStore: true },
      body: JSON.stringify({ data: { index } }),
    });
  }
  invalidateSteps();
}

export async function deleteStep(documentId: string): Promise<void> {
  await assertCanManage();
  await strapiFetch(`/steps/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateSteps();
}
