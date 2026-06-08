"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canMoveBoardTasks } from "@/lib/auth/permissions";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

interface StrapiList<T> {
  data: T[];
}

interface IdEntity {
  documentId: string;
}

async function assertCanMove(): Promise<void> {
  const session = await auth();
  if (!canMoveBoardTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function resolveDocumentId(
  path: string,
  numericId: number,
): Promise<string | null> {
  const res = await strapiFetch<StrapiList<IdEntity>>(
    path,
    { strapiCache: { noStore: true } },
    {
      fields: ["documentId"],
      filters: { id: { $eq: numericId } },
      pagination: { pageSize: 1 },
    },
  );
  return res.data[0]?.documentId ?? null;
}

export async function moveTaskToStep(
  taskId: number,
  stepId: number,
): Promise<void> {
  await assertCanMove();

  const [taskDocumentId, stepDocumentId] = await Promise.all([
    resolveDocumentId("/tasks", taskId),
    resolveDocumentId("/steps", stepId),
  ]);

  if (!taskDocumentId || !stepDocumentId) {
    throw new Error("notFound");
  }

  await strapiFetch(`/tasks/${taskDocumentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: { step: stepDocumentId } }),
  });

  revalidateStrapiTags(STRAPI_TAGS.tasks, STRAPI_TAGS.steps);
}
