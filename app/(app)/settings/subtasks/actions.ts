"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import {
  canManageSettings,
  canManageTasks,
  canManageTemplates,
} from "@/lib/auth/permissions";
import { assertMaterialFlagsEnabled } from "@/lib/business/material-flags-feature";
import { MATERIAL_FLAGS_SETTINGS_CACHE_TAG } from "@/lib/material-flags/load-material-flags-settings";
import {
  createMaterialFlag,
  createMaterialFlagsInRange,
  deleteMaterialFlag,
  findMaterialFlagById,
  listMaterialFlags,
  nextFlagIndexForCategory,
  reconcileMaterialFlagAssignments,
  updateMaterialFlag,
} from "@/lib/repos/material-flags";
import {
  getMaterialFlagsSettings,
  setMaterialFlagsEnabled,
} from "@/lib/repos/material-flags-settings";
import { runTaskSubTaskSyncRoutine } from "@/lib/repos/subtask-lifecycle";
import {
  createSubTaskCategory,
  deleteSubTaskCategory,
  findSubTaskCategoryById,
  listSubTaskCategories,
  updateSubTaskCategory,
} from "@/lib/repos/sub-task-categories";
import { loadSubTaskCategoryOptions } from "@/lib/subtasks/category-options";
import { bulkDocumentIdsSchema } from "@/lib/schemas/bulk-ids";
import {
  materialFlagBulkCreateSchema,
  materialFlagFormSchema,
  type MaterialFlagListFilters,
} from "@/lib/schemas/material-flag";
import {
  subTaskCategoryFormSchema,
  type SubTaskCategoryListFilters,
} from "@/lib/schemas/sub-task-category";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidate(): void {
  revalidatePath("/settings/subtasks", "layout");
}

async function assertMaterialFlagsFeatureOn(): Promise<void> {
  const settings = await getMaterialFlagsSettings();
  assertMaterialFlagsEnabled(settings.enabled);
}

function invalidateMaterialFlagsSettings(): void {
  revalidateTag(MATERIAL_FLAGS_SETTINGS_CACHE_TAG, "default");
  revalidateTag("drizzle:subTasks", "default");
  invalidate();
}

export async function setMaterialFlagsFeatureEnabled(
  enabled: boolean,
): Promise<void> {
  await assertCanManage();
  const current = await getMaterialFlagsSettings();
  if (enabled && !current.enabled) {
    const taskIds = await reconcileMaterialFlagAssignments();
    for (const taskId of taskIds) {
      await runTaskSubTaskSyncRoutine(taskId);
    }
  }
  await setMaterialFlagsEnabled(enabled);
  invalidateMaterialFlagsSettings();
}

export async function loadMoreCategories(
  filters: SubTaskCategoryListFilters,
  page: number,
) {
  await assertCanManage();
  const { items, total } = await listSubTaskCategories(filters, page);
  return { items, total, page };
}

export async function loadMoreFlags(
  filters: MaterialFlagListFilters,
  page: number,
) {
  await assertCanManage();
  const { items, total } = await listMaterialFlags(filters, page);
  return { items, total, page };
}

export async function saveCategory(
  raw: unknown,
  documentId?: string,
): Promise<void> {
  await assertCanManage();
  const data = subTaskCategoryFormSchema.parse(raw);
  if (documentId) {
    await updateSubTaskCategory(documentId, data);
  } else {
    await createSubTaskCategory(data);
  }
  invalidate();
}

export async function removeCategory(documentId: string): Promise<void> {
  await assertCanManage();
  await deleteSubTaskCategory(documentId);
  invalidate();
}

export async function saveFlag(
  raw: unknown,
  documentId?: string,
): Promise<void> {
  await assertCanManage();
  await assertMaterialFlagsFeatureOn();
  const data = materialFlagFormSchema.parse(raw);
  if (documentId) {
    await updateMaterialFlag(documentId, data);
  } else {
    await createMaterialFlag(data);
  }
  invalidate();
}

export async function createFlags(raw: unknown): Promise<number> {
  await assertCanManage();
  await assertMaterialFlagsFeatureOn();
  const data = materialFlagBulkCreateSchema.parse(raw);
  const created = await createMaterialFlagsInRange(data);
  invalidate();
  return created.length;
}

export async function removeFlag(documentId: string): Promise<void> {
  await assertCanManage();
  await assertMaterialFlagsFeatureOn();
  await deleteMaterialFlag(documentId);
  invalidate();
}

export async function bulkDeleteCategories(
  documentIds: string[],
): Promise<void> {
  await assertCanManage();
  const ids = bulkDocumentIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const category = await findSubTaskCategoryById(documentId);
    if (!category) throw new Error("notFound");
    await deleteSubTaskCategory(documentId);
  }
  invalidate();
}

export async function bulkDeleteFlags(documentIds: string[]): Promise<void> {
  await assertCanManage();
  await assertMaterialFlagsFeatureOn();
  const ids = bulkDocumentIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const flag = await findMaterialFlagById(documentId);
    if (!flag) throw new Error("notFound");
    await deleteMaterialFlag(documentId);
  }
  invalidate();
}

export async function nextIndexForCategory(categoryId: string): Promise<number> {
  await assertCanManage();
  await assertMaterialFlagsFeatureOn();
  return nextFlagIndexForCategory(categoryId);
}

export async function listCategoryOptions(): Promise<
  { id: string; name: string }[]
> {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (
    !canManageSettings(role) &&
    !canManageTasks(role) &&
    !canManageTemplates(role)
  ) {
    throw new Error("forbidden");
  }
  return loadSubTaskCategoryOptions();
}
