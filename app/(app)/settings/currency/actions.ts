"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { currencies } from "@/drizzle/schema";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import {
  assignedActiveCurrencyId,
  isProtectedCurrencyId,
} from "@/lib/business/primary-currency";
import { getDb } from "@/lib/db/client";
import {
  listCategoryImageAssets,
  uploadCategoryImageAsset,
} from "@/lib/media/category-image-assets";
import {
  archiveCurrency as archiveCurrencyRepo,
  createCurrency as createCurrencyRepo,
  findCurrencyById,
  hardDeleteCurrency as hardDeleteCurrencyRepo,
  listCurrencies as listCurrenciesRepo,
} from "@/lib/repos/awards";
import type { MediaAssetRecord } from "@/lib/repos/media";
import {
  getCurrencyForSubtasks,
  upsertCurrencyForSubtasks,
} from "@/lib/repos/settings";
import {
  bulkCurrencyIdsSchema,
  currencyFormSchema,
  type CurrencyFormInput,
} from "@/lib/schemas/currency";

const CURRENCY_SETTINGS_PATH = "/settings/currency";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateCurrencies(): void {
  revalidateTag("drizzle:currencies", "default");
  revalidateTag("drizzle:currency-for-subtasks", "default");
  revalidatePath(CURRENCY_SETTINGS_PATH);
}

async function listAllCurrencies() {
  return listCurrenciesRepo({ includeInactive: true });
}

async function assignedCurrencyId(): Promise<string | null> {
  const assigned = await getCurrencyForSubtasks();
  return assigned?.currencyId ?? null;
}

async function reassignSubtasksCurrencyIfNeeded(
  documentId: string,
): Promise<void> {
  const all = await listAllCurrencies();
  const fallbackId = assignedActiveCurrencyId(all, null);
  const active = await getCurrencyForSubtasks();
  if (active?.currencyId === documentId && fallbackId) {
    await upsertCurrencyForSubtasks(fallbackId);
  }
}

function assertNotProtected(
  documentId: string,
  all: Awaited<ReturnType<typeof listAllCurrencies>>,
  assignedId: string | null,
): void {
  if (isProtectedCurrencyId(documentId, all, assignedId)) {
    throw new Error("primaryCurrencyProtected");
  }
}

export async function listCurrencyImages(): Promise<MediaAssetRecord[]> {
  await assertCanManage();
  return listCategoryImageAssets("currency");
}

export async function uploadCurrencyIcon(
  formData: FormData,
): Promise<MediaAssetRecord> {
  await assertCanManage();
  return uploadCategoryImageAsset(formData, "currency");
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
  const assignedId = await assignedCurrencyId();
  assertNotProtected(documentId, all, assignedId);
  await reassignSubtasksCurrencyIfNeeded(documentId);
  await archiveCurrencyRepo(documentId);
  invalidateCurrencies();
}

export async function deleteCurrency(documentId: string): Promise<void> {
  await assertCanManage();

  const all = await listAllCurrencies();
  const assignedId = await assignedCurrencyId();
  assertNotProtected(documentId, all, assignedId);
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
  const assignedId = await assignedCurrencyId();
  const archivable = ids.filter(
    (id) => !isProtectedCurrencyId(id, all, assignedId),
  );
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
  const assignedId = await assignedCurrencyId();
  const removable = ids.filter(
    (id) => !isProtectedCurrencyId(id, all, assignedId),
  );
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
