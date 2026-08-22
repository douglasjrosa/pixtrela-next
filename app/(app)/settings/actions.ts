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
import type { CurrencyForSubtasksInput } from "@/lib/schemas/currency-for-subtasks";
import { currencyForSubtasksSchema } from "@/lib/schemas/currency-for-subtasks";
import { entryAccessSettingsSchema } from "@/lib/schemas/entry-access";
import type { TaskAutomationFormInput } from "@/lib/schemas/task-automation";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

export async function updateCurrencyForSubtasks(
  values: CurrencyForSubtasksInput,
): Promise<void> {
  await assertCanManage();
  const data = currencyForSubtasksSchema.parse(values);
  await upsertCurrencyForSubtasks(data.currencyDocumentId);
  revalidateTag("drizzle:currency-for-subtasks", "default");
  revalidateTag("drizzle:currencies", "default");
  revalidatePath("/settings/currency");
}

export async function updateKioskSessionIdleSeconds(values: {
  sessionIdleSeconds: number;
  maxSimultaneousSubtaskIntervalSeconds: number;
}): Promise<void> {
  await assertCanManage();
  await upsertKioskSettings(values);
  revalidateTag("drizzle:kiosk-setting", "default");
}

export async function updateTaskAutomationSetting(
  values: TaskAutomationFormInput,
): Promise<void> {
  await assertCanManage();
  await upsertTaskAutomationSettings(values);
  revalidateTag("drizzle:task-automation-setting", "default");
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
