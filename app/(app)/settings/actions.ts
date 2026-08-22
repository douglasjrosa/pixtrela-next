"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import { upsertEntryAccessSettings } from "@/lib/repos/entry-access";
import {
  upsertCurrencyForSubtasks,
  upsertKioskSettings,
  upsertTaskAutomationSettings,
} from "@/lib/repos/settings";
import { currencyForSubtasksSchema } from "@/lib/schemas/currency-for-subtasks";
import { entryAccessSettingsSchema } from "@/lib/schemas/entry-access";
import { kioskSessionIdleSchema } from "@/lib/schemas/kiosk-setting";
import { taskAutomationFormSchema } from "@/lib/schemas/task-automation";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function formString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function formNumber(formData: FormData, name: string): number {
  return Number(formString(formData, name));
}

export async function updateCurrencyForSubtasks(
  formData: FormData,
): Promise<void> {
  await assertCanManage();
  const data = currencyForSubtasksSchema.parse({
    currencyDocumentId: formString(formData, "currencyDocumentId"),
  });
  await upsertCurrencyForSubtasks(data.currencyDocumentId);
  revalidateTag("drizzle:currency-for-subtasks", "default");
  revalidateTag("drizzle:currencies", "default");
  revalidatePath("/settings/currency");
}

export async function updateKioskSessionIdleSeconds(
  formData: FormData,
): Promise<void> {
  await assertCanManage();
  const values = kioskSessionIdleSchema.parse({
    sessionIdleSeconds: formNumber(formData, "sessionIdleSeconds"),
    maxSimultaneousSubtaskIntervalSeconds: formNumber(
      formData,
      "maxSimultaneousSubtaskIntervalSeconds",
    ),
  });
  await upsertKioskSettings(values);
  revalidateTag("drizzle:kiosk-setting", "default");
  revalidatePath("/settings/kiosk");
}

export async function updateTaskAutomationSetting(
  formData: FormData,
): Promise<void> {
  await assertCanManage();
  const values = taskAutomationFormSchema.parse({
    waitingStepDocumentId: formString(formData, "waitingStepDocumentId"),
    producingStepDocumentId: formString(formData, "producingStepDocumentId"),
    pausedStepDocumentId: formString(formData, "pausedStepDocumentId"),
    finishedStepDocumentId: formString(formData, "finishedStepDocumentId"),
    reviewedStepDocumentId: formString(formData, "reviewedStepDocumentId"),
    deliveredStepDocumentId: formString(formData, "deliveredStepDocumentId"),
    assignWarnMax: formNumber(formData, "assignWarnMax"),
  });
  await upsertTaskAutomationSettings(values);
  revalidateTag("drizzle:task-automation-setting", "default");
  revalidatePath("/settings/automations");
}

export async function updateEntryAccessSettings(
  raw: unknown,
): Promise<void> {
  await assertCanManage();
  const data = entryAccessSettingsSchema.parse(raw);
  await upsertEntryAccessSettings(data.surface, {
    computer: data.computer,
    mobile: data.mobile,
  });
  revalidateTag("drizzle:entry-access", "default");
}
