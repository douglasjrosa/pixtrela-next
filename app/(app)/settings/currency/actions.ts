"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import {
  currencyFormSchema,
  type CurrencyFormInput,
} from "@/lib/schemas/currency";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import {
  CURRENCY_FOR_SUBTASKS_API_PATH,
  loadCurrencyForSubtasks,
  toCurrencyForSubtasksPayload,
} from "@/lib/strapi/currency-for-subtasks";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";
import { strapiUpload } from "@/lib/strapi/upload";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function toStrapiPayload(input: CurrencyFormInput) {
  const payload: Record<string, unknown> = {
    name: input.name,
    title: input.title,
    pluralTitle: input.pluralTitle,
    currencyPerSecond: input.currencyPerSecond,
  };
  if (input.iconMediaId) {
    payload.iconMedia = input.iconMediaId;
  }
  return payload;
}

function invalidateCurrencies(): void {
  revalidateStrapiTags(STRAPI_TAGS.currencies);
}

export async function uploadCurrencyIcon(formData: FormData): Promise<number> {
  await assertCanManage();
  const entry = formData.get("file");
  if (!(entry instanceof Blob) || entry.size === 0) {
    throw new Error("invalid");
  }
  const mimeType = entry.type || "image/png";
  const file =
    entry instanceof File
      ? entry
      : new File([entry], "currency-icon.png", { type: mimeType });
  return strapiUpload(file);
}

export async function createCurrency(raw: CurrencyFormInput): Promise<void> {
  await assertCanManage();
  const data = currencyFormSchema.parse(raw);
  await strapiFetch("/currencies", {
    method: "POST",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data) }),
  });
  invalidateCurrencies();
}

export async function updateCurrency(
  documentId: string,
  raw: CurrencyFormInput,
): Promise<void> {
  await assertCanManage();
  const data = currencyFormSchema.parse(raw);
  await strapiFetch(`/currencies/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data) }),
  });
  invalidateCurrencies();
}

export async function deleteCurrency(documentId: string): Promise<void> {
  await assertCanManage();

  const active = await loadCurrencyForSubtasks();
  if (active.currencyDocumentId === documentId) {
    await strapiFetch(CURRENCY_FOR_SUBTASKS_API_PATH, {
      method: "PUT",
      strapiCache: { noStore: true },
      body: JSON.stringify({
        data: toCurrencyForSubtasksPayload({ currencyDocumentId: "" }),
      }),
    });
    revalidateStrapiTags(STRAPI_TAGS.currencyForSubtasks);
  }

  await strapiFetch(`/currencies/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateCurrencies();
}
