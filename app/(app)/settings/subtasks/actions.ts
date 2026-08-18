"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import {
  canManageSettings,
  canManageTasks,
  canManageTemplates,
} from "@/lib/auth/permissions";
import {
  createMaterialFlag,
  deleteMaterialFlag,
  listMaterialFlags,
  nextFlagIndexForCategory,
  updateMaterialFlag,
} from "@/lib/repos/material-flags";
import {
  createSubTaskCategory,
  deleteSubTaskCategory,
  listAllSubTaskCategories,
  listSubTaskCategories,
  updateSubTaskCategory,
} from "@/lib/repos/sub-task-categories";
import {
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
  const data = materialFlagFormSchema.parse(raw);
  if (documentId) {
    await updateMaterialFlag(documentId, data);
  } else {
    await createMaterialFlag(data);
  }
  invalidate();
}

export async function removeFlag(documentId: string): Promise<void> {
  await assertCanManage();
  await deleteMaterialFlag(documentId);
  invalidate();
}

export async function nextIndexForCategory(categoryId: string): Promise<number> {
  await assertCanManage();
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
  const rows = await listAllSubTaskCategories();
  return rows.map((row) => ({ id: row.id, name: row.name }));
}
