"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import { KIOSK_SETTING_API_PATH } from "@/lib/strapi/kiosk-setting";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

interface StrapiList<T> {
  data: T[];
}

interface CurrencyEntity {
  documentId: string;
  currencyPerSecond: number;
}

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function loadStarCurrency(): Promise<CurrencyEntity | null> {
  const res = await strapiFetch<StrapiList<CurrencyEntity>>(
    "/currencies",
    { strapiCache: { noStore: true } },
    {
      fields: ["documentId", "currencyPerSecond"],
      pagination: { pageSize: 1 },
    },
  );
  return res.data[0] ?? null;
}

export async function updateCurrencyPerSecond(
  currencyPerSecond: number,
): Promise<void> {
  await assertCanManage();
  const currency = await loadStarCurrency();
  if (!currency) throw new Error("notFound");

  await strapiFetch(`/currencies/${currency.documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: { currencyPerSecond } }),
  });

  revalidateStrapiTags(STRAPI_TAGS.currencies);
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
