"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import type { CurrencyForSubtasksInput } from "@/lib/schemas/currency-for-subtasks";
import type { CurrencyRateInput } from "@/lib/schemas/currency-rates";
import type { TaskAutomationFormInput } from "@/lib/schemas/task-automation";
import {
  CURRENCY_FOR_SUBTASKS_API_PATH,
  toCurrencyForSubtasksPayload,
} from "@/lib/strapi/currency-for-subtasks";
import { KIOSK_SETTING_API_PATH } from "@/lib/strapi/kiosk-setting";
import {
  TASK_AUTOMATION_SETTING_API_PATH,
  toTaskAutomationSettingPayload,
} from "@/lib/strapi/task-automation-setting";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

export async function updateCurrencyRates(
  rates: CurrencyRateInput[],
): Promise<void> {
  await assertCanManage();
  if (rates.length === 0) return;

  await Promise.all(
    rates.map((rate) =>
      strapiFetch(`/currencies/${rate.documentId}`, {
        method: "PUT",
        strapiCache: { noStore: true },
        body: JSON.stringify({
          data: { currencyPerSecond: rate.currencyPerSecond },
        }),
      }),
    ),
  );

  revalidateStrapiTags(STRAPI_TAGS.currencies);
}

export async function updateCurrencyForSubtasks(
  values: CurrencyForSubtasksInput,
): Promise<void> {
  await assertCanManage();

  await strapiFetch(CURRENCY_FOR_SUBTASKS_API_PATH, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({
      data: toCurrencyForSubtasksPayload(values),
    }),
  });

  revalidateStrapiTags(STRAPI_TAGS.currencyForSubtasks);
}

export async function updateKioskSessionIdleSeconds(
  sessionIdleSeconds: number,
): Promise<void> {
  await assertCanManage();

  await strapiFetch(KIOSK_SETTING_API_PATH, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: { sessionIdleSeconds } }),
  });

  revalidateStrapiTags(STRAPI_TAGS.kioskSetting);
}

export async function updateTaskAutomationSetting(
  values: TaskAutomationFormInput,
): Promise<void> {
  await assertCanManage();

  await strapiFetch(TASK_AUTOMATION_SETTING_API_PATH, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({
      data: toTaskAutomationSettingPayload(values),
    }),
  });

  revalidateStrapiTags(STRAPI_TAGS.taskAutomationSetting, STRAPI_TAGS.tasks);
}
