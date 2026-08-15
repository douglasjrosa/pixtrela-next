"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks, canManageTemplates } from "@/lib/auth/permissions";
import {
  shouldSearchSubTaskPresets,
  type SubTaskPreset,
} from "@/lib/business/subtask-preset";
import {
  createSubTaskPresetRepo,
  deleteSubTaskPresetById,
  listSubTaskPresetsRepo,
  searchSubTaskPresetsByName,
  updateSubTaskPresetRepo,
} from "@/lib/repos/sub-task-presets";
import {
  subTaskPresetFormSchema,
  type SubTaskPresetFormInput,
} from "@/lib/schemas/sub-task-preset";

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

function invalidatePresets(): void {
  revalidateTag("drizzle:sub-task-presets", "default");
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
  await deleteSubTaskPresetById(documentId);
  invalidatePresets();
}
