"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { currencies, mediaAssets } from "@/drizzle/schema";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
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
import { isPrimaryCurrencyId, primaryCurrencyId } from "@/lib/business/primary-currency";
import {
  currencyFormSchema,
  type CurrencyFormInput,
} from "@/lib/schemas/currency";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateCurrencies(): void {
  revalidateTag("drizzle:currencies", "default");
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

export async function createCurrency(raw: CurrencyFormInput): Promise<void> {
  await assertCanManage();
  const data = currencyFormSchema.parse(raw);

  await createCurrencyRepo({
    name: data.name,
    title: data.title,
    pluralTitle: data.pluralTitle,
    currencyPerSecond: data.currencyPerSecond,
    iconMediaId:
      typeof data.iconMediaId === "string" ? data.iconMediaId : null,
  });
  invalidateCurrencies();
}

export async function updateCurrency(
  documentId: string,
  raw: CurrencyFormInput,
): Promise<void> {
  await assertCanManage();
  const data = currencyFormSchema.parse(raw);

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
}

export async function deleteCurrency(documentId: string): Promise<void> {
  await assertCanManage();

  const all = await listCurrenciesRepo();
  const primaryId = primaryCurrencyId(all);
  if (isPrimaryCurrencyId(documentId, all)) {
    throw new Error("primaryCurrencyProtected");
  }

  const active = await getCurrencyForSubtasks();
  if (active?.currencyId === documentId && primaryId) {
    await upsertCurrencyForSubtasks(primaryId);
    revalidateTag("drizzle:currency-for-subtasks", "default");
  }
  const db = getDb();
  await db.delete(currencies).where(eq(currencies.id, documentId));
  invalidateCurrencies();
}

export async function listCurrenciesAction() {
  await assertCanManage();
  return listCurrenciesRepo();
}
