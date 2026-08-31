"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTemplates,
  canDeleteTemplates,
  canManageTasks,
  canManageTemplates,
} from "@/lib/auth/permissions";
import {
  shouldSearchSubTaskPresets,
  type SubTaskPreset,
} from "@/lib/business/subtask-preset";
import {
  archiveSubTaskPresetById,
  createSubTaskPresetRepo,
  findSubTaskPresetById,
  hardDeleteSubTaskPresetById,
  listSubTaskPresetsRepo,
  searchSubTaskPresetsByName,
  updateSubTaskPresetRepo,
} from "@/lib/repos/sub-task-presets";
import {
  subTaskPresetFormSchema,
  type SubTaskPresetFormInput,
} from "@/lib/schemas/sub-task-preset";
import { bulkDocumentIdsSchema } from "@/lib/schemas/bulk-ids";
import { subtaskPresetListFiltersSchema } from "@/lib/schemas/subtask-preset-list-filters";
import {
  loadSubtaskPresetListPage,
  type SubtaskPresetListPageResult,
} from "@/lib/subtask-presets/load-subtask-preset-list-page";

async function assertCanSearchPresets(): Promise<void> {
  const session = await auth();
  if (!canManageTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanManagePresets(): Promise<void> {
  const session = await auth();
  if (!canManageTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanDeactivatePresets(): Promise<void> {
  const session = await auth();
  if (!canDeactivateTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidatePresets(): void {
  revalidateTag("drizzle:sub-task-presets", "default");
  revalidatePath("/templates/subtasks");
}

export async function searchSubTaskPresets(
  query: string,
): Promise<SubTaskPreset[]> {
  await assertCanSearchPresets();

  const trimmed = query.trim();
  if (!shouldSearchSubTaskPresets(trimmed)) {
    return [];
  }

  return searchSubTaskPresetsByName(trimmed);
}

export async function listSubTaskPresets(): Promise<SubTaskPreset[]> {
  await assertCanManagePresets();
  return listSubTaskPresetsRepo();
}

export async function loadMoreSubTaskPresets(
  rawFilters: unknown,
  page: number,
): Promise<SubtaskPresetListPageResult> {
  await assertCanManagePresets();
  const filters = subtaskPresetListFiltersSchema.parse(rawFilters);
  return loadSubtaskPresetListPage(filters, page);
}

export async function createSubTaskPreset(
  raw: SubTaskPresetFormInput,
): Promise<string> {
  await assertCanManagePresets();
  const data = subTaskPresetFormSchema.parse(raw);
  const id = await createSubTaskPresetRepo(data);
  invalidatePresets();
  return id;
}

export async function updateSubTaskPreset(
  documentId: string,
  raw: SubTaskPresetFormInput,
): Promise<void> {
  await assertCanManagePresets();
  const data = subTaskPresetFormSchema.parse(raw);
  await updateSubTaskPresetRepo(documentId, data);
  invalidatePresets();
}

export async function deleteSubTaskPreset(documentId: string): Promise<void> {
  await assertCanManagePresets();
  await archiveSubTaskPresetById(documentId);
  invalidatePresets();
}

export async function bulkArchiveSubTaskPresets(
  documentIds: string[],
): Promise<void> {
  await assertCanDeactivatePresets();
  const ids = bulkDocumentIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const preset = await findSubTaskPresetById(documentId);
    if (!preset) throw new Error("notFound");
    await archiveSubTaskPresetById(documentId);
  }
  invalidatePresets();
}

export async function bulkDeleteSubTaskPresets(
  documentIds: string[],
): Promise<void> {
  await assertCanManagePresets();
  const session = await auth();
  if (!canDeleteTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
  const ids = bulkDocumentIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const preset = await findSubTaskPresetById(documentId);
    if (!preset) throw new Error("notFound");
    if (preset.active) throw new Error("activePreset");
    await hardDeleteSubTaskPresetById(documentId);
  }
  invalidatePresets();
}
