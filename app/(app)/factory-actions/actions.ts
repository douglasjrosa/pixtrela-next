"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTemplates,
  canDeleteTemplates,
  canManageTemplates,
} from "@/lib/auth/permissions";
import {
  shouldSearchFactoryActions,
  type FactoryAction,
} from "@/lib/business/factory-action";
import {
  loadFactoryActionListPage,
  type FactoryActionListPageResult,
} from "@/lib/factory-actions/load-factory-action-list-page";
import {
  archiveFactoryActionById,
  createFactoryActionRepo,
  getFactoryActionById,
  hardDeleteFactoryActionById,
  searchFactoryActionsByName,
  updateFactoryActionRepo,
} from "@/lib/repos/factory-actions";
import {
  factoryActionFormSchema,
  type FactoryActionFormInput,
} from "@/lib/schemas/factory-action";
import { bulkDocumentIdsSchema } from "@/lib/schemas/bulk-ids";
import { factoryActionListFiltersSchema } from "@/lib/schemas/factory-action-list-filters";

async function assertCanManageActions(): Promise<void> {
  const session = await auth();
  if (!canManageTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanDeactivateActions(): Promise<void> {
  const session = await auth();
  if (!canDeactivateTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateActions(): void {
  revalidateTag("drizzle:factory-actions", "default");
  revalidateTag("drizzle:sub-task-presets", "default");
  revalidatePath("/templates/actions");
  revalidatePath("/templates/subtasks");
}

export async function searchFactoryActions(
  query: string,
): Promise<FactoryAction[]> {
  await assertCanManageActions();
  const trimmed = query.trim();
  if (!shouldSearchFactoryActions(trimmed)) {
    return [];
  }
  return searchFactoryActionsByName(trimmed);
}

export async function loadMoreFactoryActions(
  rawFilters: unknown,
  page: number,
): Promise<FactoryActionListPageResult> {
  await assertCanManageActions();
  const filters = factoryActionListFiltersSchema.parse(rawFilters);
  return loadFactoryActionListPage(filters, page);
}

export async function createFactoryAction(
  raw: FactoryActionFormInput,
): Promise<string> {
  await assertCanManageActions();
  const data = factoryActionFormSchema.parse(raw);
  const id = await createFactoryActionRepo(data);
  invalidateActions();
  return id;
}

export async function updateFactoryAction(
  documentId: string,
  raw: FactoryActionFormInput,
): Promise<void> {
  await assertCanManageActions();
  const data = factoryActionFormSchema.parse(raw);
  await updateFactoryActionRepo(documentId, data);
  invalidateActions();
}

export async function deleteFactoryAction(documentId: string): Promise<void> {
  await assertCanManageActions();
  await archiveFactoryActionById(documentId);
  invalidateActions();
}

export async function bulkArchiveFactoryActions(
  documentIds: string[],
): Promise<void> {
  await assertCanDeactivateActions();
  const ids = bulkDocumentIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const action = await getFactoryActionById(documentId);
    if (!action) throw new Error("notFound");
    await archiveFactoryActionById(documentId);
  }
  invalidateActions();
}

export async function bulkDeleteFactoryActions(
  documentIds: string[],
): Promise<void> {
  await assertCanManageActions();
  const session = await auth();
  if (!canDeleteTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
  const ids = bulkDocumentIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const action = await getFactoryActionById(documentId);
    if (!action) throw new Error("notFound");
    if (action.active) throw new Error("activeAction");
    await hardDeleteFactoryActionById(documentId);
  }
  invalidateActions();
}
