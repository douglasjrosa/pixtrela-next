"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";
import {
  shouldSearchFactoryActions,
  type FactoryAction,
} from "@/lib/business/factory-action";
import {
  loadFactoryActionListPage,
  type FactoryActionListPageResult,
} from "@/lib/factory-actions/load-factory-action-list-page";
import {
  createFactoryActionRepo,
  deleteFactoryActionById,
  searchFactoryActionsByName,
  updateFactoryActionRepo,
} from "@/lib/repos/factory-actions";
import {
  factoryActionFormSchema,
  type FactoryActionFormInput,
} from "@/lib/schemas/factory-action";
import { factoryActionListFiltersSchema } from "@/lib/schemas/factory-action-list-filters";

async function assertCanManageActions(): Promise<void> {
  const session = await auth();
  if (!canManageTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateActions(): void {
  revalidateTag("drizzle:factory-actions", "default");
  revalidateTag("drizzle:sub-task-presets", "default");
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
  await deleteFactoryActionById(documentId);
  invalidateActions();
}
