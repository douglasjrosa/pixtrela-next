"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { applyAutoStepTaskOrdering } from "@/lib/business/apply-step-task-order";
import { isAutoStepTaskOrder } from "@/lib/schemas/step-task-order-by";
import {
  buildStepIndexUpdates,
  getNextStepIndex,
} from "@/lib/business/step-order";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import {
  createStep as createStepRepo,
  deleteStep as deleteStepRepo,
  getStepById,
  listSteps as listStepsRepo,
  updateStepFields,
  updateStepIndex,
} from "@/lib/repos/steps";
import {
  stepNameFormSchema,
  type StepNameFormInput,
} from "@/lib/schemas/step";
import {
  mapStepRecordToSettingsRow,
  type SettingsStepRow,
} from "@/lib/steps/map-settings-step";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateSteps(): void {
  revalidateTag("drizzle:steps", "default");
  revalidateTag("drizzle:tasks", "default");
  revalidatePath("/settings/steps");
}

async function fetchStepIndexes(): Promise<number[]> {
  const rows = await listStepsRepo();
  return rows.map((step) => step.index);
}

async function fetchStepIds(): Promise<string[]> {
  const rows = await listStepsRepo();
  return rows.map((step) => step.id);
}

export async function createStep(
  raw: StepNameFormInput,
): Promise<SettingsStepRow> {
  await assertCanManage();
  const { name, orderBy } = stepNameFormSchema.parse(raw);
  const indexes = await fetchStepIndexes();
  const index = getNextStepIndex(indexes.map((value) => ({ index: value })));

  const created = await createStepRepo({ name, index, taskOrderBy: orderBy });
  if (orderBy !== "manual") {
    await applyAutoStepTaskOrdering({ stepIds: [created.id] });
  }
  invalidateSteps();
  return mapStepRecordToSettingsRow(created);
}

export async function updateStep(
  documentId: string,
  raw: StepNameFormInput,
): Promise<void> {
  await assertCanManage();
  const { name, orderBy } = stepNameFormSchema.parse(raw);

  const existing = await getStepById(documentId);
  await updateStepFields(documentId, { name, taskOrderBy: orderBy });
  if (
    existing &&
    existing.taskOrderBy !== orderBy &&
    isAutoStepTaskOrder(orderBy)
  ) {
    await applyAutoStepTaskOrdering({ stepIds: [documentId] });
  }
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
    await updateStepIndex(documentId, index);
  }
  invalidateSteps();
}

export async function deleteStep(documentId: string): Promise<void> {
  await assertCanManage();
  await deleteStepRepo(documentId);
  invalidateSteps();
}
