"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import {
  upsertCurrencyForSubtasks,
  upsertKioskSettings,
  upsertTaskAutomationSettings,
} from "@/lib/repos/settings";
import type { CurrencyForSubtasksInput } from "@/lib/schemas/currency-for-subtasks";
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
  await upsertCurrencyForSubtasks(values.currencyDocumentId || null);
  revalidateTag("drizzle:currency-for-subtasks", "default");
}

export async function updateKioskSessionIdleSeconds(
  sessionIdleSeconds: number,
): Promise<void> {
  await assertCanManage();
  await upsertKioskSettings(sessionIdleSeconds);
  revalidateTag("drizzle:kiosk-setting", "default");
}

export async function updateTaskAutomationSetting(
  values: TaskAutomationFormInput,
): Promise<void> {
  await assertCanManage();
  await upsertTaskAutomationSettings(values);
  revalidateTag("drizzle:task-automation-setting", "default");
}
