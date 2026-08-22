"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { currencies } from "@/drizzle/schema";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import {
  isPrimaryCurrencyId,
  primaryCurrencyId,
} from "@/lib/business/primary-currency";
import { getDb } from "@/lib/db/client";
import { storeMedia } from "@/lib/media/store-media";
import {
  archiveCurrency as archiveCurrencyRepo,
  createCurrency as createCurrencyRepo,
  findCurrencyById,
  hardDeleteCurrency as hardDeleteCurrencyRepo,
  listCurrencies as listCurrenciesRepo,
} from "@/lib/repos/awards";
import { insertMediaAsset } from "@/lib/repos/media";
import {
  getCurrencyForSubtasks,
  upsertCurrencyForSubtasks,
} from "@/lib/repos/settings";
import {
  bulkCurrencyIdsSchema,
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

async function listAllCurrencies() {
  return listCurrenciesRepo({ includeInactive: true });
}

async function reassignSubtasksCurrencyIfNeeded(
  documentId: string,
): Promise<void> {
  const all = await listAllCurrencies();
  const primaryId = primaryCurrencyId(all);
  const active = await getCurrencyForSubtasks();
  if (active?.currencyId === documentId && primaryId) {
    await upsertCurrencyForSubtasks(primaryId);
    revalidateTag("drizzle:currency-for-subtasks", "default");
  }
}

function assertNotPrimary(
  documentId: string,
  all: Awaited<ReturnType<typeof listAllCurrencies>>,
): void {
  if (isPrimaryCurrencyId(documentId, all)) {
    throw new Error("primaryCurrencyProtected");
  }
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
  const originalFilename =
    "name" in entry && typeof entry.name === "string" && entry.name.trim()
      ? entry.name.trim()
      : null;
  const media = await insertMediaAsset(stored, {
    originalFilename,
    category: "currency",
    sensitivity: "public",
  });
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

export async function archiveCurrency(documentId: string): Promise<void> {
  await assertCanManage();
  const all = await listAllCurrencies();
  assertNotPrimary(documentId, all);
  await reassignSubtasksCurrencyIfNeeded(documentId);
  await archiveCurrencyRepo(documentId);
  invalidateCurrencies();
}

export async function deleteCurrency(documentId: string): Promise<void> {
  await assertCanManage();

  const all = await listAllCurrencies();
  assertNotPrimary(documentId, all);
  await reassignSubtasksCurrencyIfNeeded(documentId);
  await hardDeleteCurrencyRepo(documentId);
  invalidateCurrencies();
}

export async function bulkArchiveCurrencies(
  documentIds: string[],
): Promise<void> {
  await assertCanManage();
  const ids = bulkCurrencyIdsSchema.parse(documentIds);
  const all = await listAllCurrencies();
  const archivable = ids.filter((id) => !isPrimaryCurrencyId(id, all));
  if (archivable.length === 0) {
    throw new Error("primaryCurrencyProtected");
  }

  for (const documentId of archivable) {
    await reassignSubtasksCurrencyIfNeeded(documentId);
    await archiveCurrencyRepo(documentId);
  }
  invalidateCurrencies();
}

export async function bulkDeleteCurrencies(
  documentIds: string[],
): Promise<void> {
  await assertCanManage();
  const ids = bulkCurrencyIdsSchema.parse(documentIds);
  const all = await listAllCurrencies();
  const removable = ids.filter((id) => !isPrimaryCurrencyId(id, all));
  if (removable.length === 0) {
    throw new Error("primaryCurrencyProtected");
  }

  for (const documentId of removable) {
    const currency = await findCurrencyById(documentId);
    if (!currency) throw new Error("notFound");
    if (currency.active) throw new Error("activeCurrency");
    await reassignSubtasksCurrencyIfNeeded(documentId);
    await hardDeleteCurrencyRepo(documentId);
  }
  invalidateCurrencies();
}

export async function listCurrenciesAction() {
  await assertCanManage();
  return listCurrenciesRepo({ includeInactive: true });
}
