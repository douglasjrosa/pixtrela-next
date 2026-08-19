"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { awards } from "@/drizzle/schema";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateAwards,
  canDeleteAwards,
  canManageAwards,
  canViewAwards,
} from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/client";
import { storeMedia } from "@/lib/media/store-media";
import {
  createAward as createAwardRepo,
  deleteAward as deleteAwardRepo,
  findAwardById,
  hardDeleteAward,
  replaceAwardPrices,
} from "@/lib/repos/awards";
import { insertMediaAsset, listMediaAssets, type MediaAssetRecord } from "@/lib/repos/media";
import {
  awardFormSchema,
  bulkAwardIdsSchema,
  type AwardFormInput,
} from "@/lib/schemas/award";
import { awardListFiltersSchema } from "@/lib/schemas/award-list-filters";
import {
  loadAwardListPage,
  type AwardListPageResult,
} from "@/lib/awards/load-award-list-page";

async function assertCanView(): Promise<void> {
  const session = await auth();
  if (!canViewAwards(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageAwards(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanDeactivate(): Promise<void> {
  const session = await auth();
  if (!canDeactivateAwards(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanDelete(): Promise<void> {
  const session = await auth();
  if (!canDeleteAwards(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateAwards(): void {
  revalidateTag("drizzle:awards", "default");
}

export async function loadMoreAwards(
  rawFilters: unknown,
  page: number,
): Promise<AwardListPageResult> {
  await assertCanView();
  const filters = awardListFiltersSchema.parse(rawFilters);
  return loadAwardListPage(filters, page);
}

export async function listAwardImages(): Promise<MediaAssetRecord[]> {
  await assertCanManage();
  const result = await listMediaAssets({
    mimeFilter: "image",
    category: "award",
    includeBiometric: false,
    page: 1,
    pageSize: 100,
  });
  return result.items;
}

export async function uploadAwardImage(
  formData: FormData,
): Promise<MediaAssetRecord> {
  await assertCanManage();
  const entry = formData.get("file");
  if (!(entry instanceof Blob) || entry.size === 0) {
    throw new Error("invalid");
  }
  const mimeType = entry.type || "image/jpeg";
  const buffer = Buffer.from(await entry.arrayBuffer());
  const extension = mimeType.includes("png") ? "png" : "jpg";
  const stored = await storeMedia({ bytes: buffer, mimeType, extension });
  const originalFilename =
    "name" in entry && typeof entry.name === "string" && entry.name.trim()
      ? entry.name.trim()
      : null;
  const media = await insertMediaAsset(stored, {
    originalFilename,
    category: "award",
    sensitivity: "public",
  });
  return media;
}

export async function createAward(raw: AwardFormInput): Promise<void> {
  await assertCanManage();
  const data = awardFormSchema.parse(raw);
  await createAwardRepo({
    name: data.name,
    title: data.title || null,
    description: data.description || null,
    warnings: data.warnings || null,
    imageMediaId:
      typeof data.imageId === "string" ? data.imageId : null,
    active: true,
    showInStore: data.showInStore,
    stock: data.stock,
    prices: data.values.map((entry) => ({
      currencyId: entry.currencyDocumentId,
      numberOf: entry.numberOf,
    })),
  });
  invalidateAwards();
}

export async function updateAward(
  documentId: string,
  raw: AwardFormInput,
): Promise<void> {
  await assertCanManage();
  const data = awardFormSchema.parse(raw);
  const db = getDb();
  await db
    .update(awards)
    .set({
      name: data.name,
      title: data.title || null,
      description: data.description || null,
      warnings: data.warnings || null,
      imageMediaId:
        typeof data.imageId === "string" ? data.imageId : undefined,
      showInStore: data.showInStore,
      stock: data.stock,
      updatedAt: new Date(),
    })
    .where(eq(awards.id, documentId));
  await replaceAwardPrices(
    documentId,
    data.values.map((entry) => ({
      currencyId: entry.currencyDocumentId,
      numberOf: entry.numberOf,
    })),
    db,
  );
  invalidateAwards();
}

export async function deleteAward(documentId: string): Promise<void> {
  await assertCanDeactivate();
  await deleteAwardRepo(documentId);
  invalidateAwards();
}

export async function permanentlyDeleteAward(documentId: string): Promise<void> {
  await assertCanDelete();
  const award = await findAwardById(documentId);
  if (!award) throw new Error("notFound");
  if (award.active) throw new Error("activeAward");
  await hardDeleteAward(documentId);
  invalidateAwards();
}

export async function bulkArchiveAwards(
  documentIds: string[],
): Promise<void> {
  await assertCanDeactivate();
  const ids = bulkAwardIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const award = await findAwardById(documentId);
    if (!award) throw new Error("notFound");
    await deleteAwardRepo(documentId);
  }
  invalidateAwards();
}

export async function bulkDeleteAwards(documentIds: string[]): Promise<void> {
  await assertCanDelete();
  const ids = bulkAwardIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const award = await findAwardById(documentId);
    if (!award) throw new Error("notFound");
    if (award.active) throw new Error("activeAward");
    await hardDeleteAward(documentId);
  }
  invalidateAwards();
}
