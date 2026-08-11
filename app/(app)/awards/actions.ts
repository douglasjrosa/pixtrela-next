"use server";

import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { awards, mediaAssets } from "@/drizzle/schema";
import type { Role } from "@/lib/auth/nav";
import { canManageAwards } from "@/lib/auth/permissions";
import { isDrizzleBackend } from "@/lib/db/backend";
import { getDb } from "@/lib/db/client";
import { storeMedia } from "@/lib/media/store-media";
import {
  createAward as createAwardRepo,
  replaceAwardPrices,
} from "@/lib/repos/awards";
import { awardFormSchema, type AwardFormInput } from "@/lib/schemas/award";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";
import { strapiUpload } from "@/lib/strapi/upload";
import { revalidateTag } from "next/cache";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageAwards(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function toStrapiPayload(input: AwardFormInput) {
  const payload: Record<string, unknown> = {
    name: input.name,
    title: input.title || null,
    description: input.description || null,
    warnings: input.warnings || null,
    Value: input.values.map((entry) => ({
      numberOf: entry.numberOf,
      currency: entry.currencyDocumentId,
    })),
  };
  if (input.imageId) {
    payload.image = input.imageId;
  }
  return payload;
}

function invalidateAwards(): void {
  if (isDrizzleBackend()) {
    revalidateTag("drizzle:awards", "default");
    return;
  }
  revalidateStrapiTags(STRAPI_TAGS.awards);
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
      : new File([entry], "award-image.jpg", { type: mimeType });
  return strapiUpload(file);
}

export async function createAward(raw: AwardFormInput): Promise<void> {
  await assertCanManage();
  const data = awardFormSchema.parse(raw);

  if (isDrizzleBackend()) {
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
    return;
  }

  await strapiFetch("/awards", {
    method: "POST",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data) }),
  });
  invalidateAwards();
}

export async function updateAward(
  documentId: string,
  raw: AwardFormInput,
): Promise<void> {
  await assertCanManage();
  const data = awardFormSchema.parse(raw);

  if (isDrizzleBackend()) {
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
    return;
  }

  await strapiFetch(`/awards/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data) }),
  });
  invalidateAwards();
}

export async function deleteAward(documentId: string): Promise<void> {
  await assertCanManage();

  if (isDrizzleBackend()) {
    const db = getDb();
    await db
      .update(awards)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(awards.id, documentId));
    invalidateAwards();
    return;
  }

  await strapiFetch(`/awards/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateAwards();
}
