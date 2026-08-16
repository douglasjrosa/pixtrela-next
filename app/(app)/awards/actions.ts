"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { awards, mediaAssets } from "@/drizzle/schema";
import type { Role } from "@/lib/auth/nav";
import { canManageAwards, canViewAwards } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/client";
import { storeMedia } from "@/lib/media/store-media";
import {
  createAward as createAwardRepo,
  replaceAwardPrices,
} from "@/lib/repos/awards";
import { awardFormSchema, type AwardFormInput } from "@/lib/schemas/award";
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

export async function uploadAwardImage(
  formData: FormData,
): Promise<number | string> {
  await assertCanManage();
  const entry = formData.get("file");
  if (!(entry instanceof Blob) || entry.size === 0) {
    throw new Error("invalid");
  }
  const mimeType = entry.type || "image/jpeg";
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
  await assertCanManage();
  const db = getDb();
  await db
    .update(awards)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(awards.id, documentId));
  invalidateAwards();
}
