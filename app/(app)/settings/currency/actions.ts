"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { currencies, mediaAssets } from "@/drizzle/schema";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import { isDrizzleBackend } from "@/lib/db/backend";
import { getDb } from "@/lib/db/client";
import { storeMedia } from "@/lib/media/store-media";
import {
  createCurrency as createCurrencyRepo,
  listCurrencies as listCurrenciesRepo,
} from "@/lib/repos/awards";
import {
  getCurrencyForSubtasks,
  upsertCurrencyForSubtasks,
} from "@/lib/repos/settings";
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
  if (isDrizzleBackend()) {
    revalidateTag("drizzle:currencies");
    return;
  }
  revalidateStrapiTags(STRAPI_TAGS.currencies);
}

export async function uploadCurrencyIcon(
  formData: FormData,
): Promise<number | string> {
  await assertCanManage();
  const entry = formData.get("file");
  if (!(entry instanceof Blob) || entry.size === 0) {
    throw new Error("invalid");
  }
  const mimeType = entry.type || "image/png";

  if (isDrizzleBackend()) {
    const buffer = Buffer.from(await entry.arrayBuffer());
    const extension = mimeType.includes("png") ? "png" : "jpg";
    const stored = await storeMedia({ bytes: buffer, mimeType, extension });
    const db = getDb();
    const [media] = await db
      .insert(mediaAssets)
      .values({
        storageKey: stored.storageKey,
        url: stored.url,
        mimeType: stored.mimeType,
        byteSize: stored.byteSize,
      })
      .returning({ id: mediaAssets.id });
    return media.id;
  }

  const file =
    entry instanceof File
      ? entry
      : new File([entry], "currency-icon.png", { type: mimeType });
  return strapiUpload(file);
}

export async function createCurrency(raw: CurrencyFormInput): Promise<void> {
  await assertCanManage();
  const data = currencyFormSchema.parse(raw);

  if (isDrizzleBackend()) {
    await createCurrencyRepo({
      name: data.name,
      title: data.title,
      pluralTitle: data.pluralTitle,
      currencyPerSecond: data.currencyPerSecond,
      iconMediaId:
        typeof data.iconMediaId === "string" ? data.iconMediaId : null,
    });
    invalidateCurrencies();
    return;
  }

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

  if (isDrizzleBackend()) {
    const db = getDb();
    const patch: Partial<typeof currencies.$inferInsert> & {
      updatedAt: Date;
    } = {
      name: data.name,
      title: data.title,
      pluralTitle: data.pluralTitle,
      currencyPerSecond: data.currencyPerSecond,
      updatedAt: new Date(),
    };
    if (typeof data.iconMediaId === "string") {
      patch.iconMediaId = data.iconMediaId;
    }
    await db.update(currencies).set(patch).where(eq(currencies.id, documentId));
    invalidateCurrencies();
    return;
  }

  await strapiFetch(`/currencies/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data) }),
  });
  invalidateCurrencies();
}

export async function deleteCurrency(documentId: string): Promise<void> {
  await assertCanManage();

  if (isDrizzleBackend()) {
    const active = await getCurrencyForSubtasks();
    if (active?.currencyId === documentId) {
      await upsertCurrencyForSubtasks(null);
      revalidateTag("drizzle:currency-for-subtasks");
    }
    const db = getDb();
    await db.delete(currencies).where(eq(currencies.id, documentId));
    invalidateCurrencies();
    return;
  }

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

/** Exposed for tests / callers that need the catalog under drizzle. */
export async function listCurrenciesAction() {
  await assertCanManage();
  if (!isDrizzleBackend()) {
    throw new Error("listCurrenciesAction requires DATA_BACKEND=drizzle");
  }
  return listCurrenciesRepo();
}
