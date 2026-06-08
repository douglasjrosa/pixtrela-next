"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageAwards } from "@/lib/auth/permissions";
import { awardFormSchema, type AwardFormInput } from "@/lib/schemas/award";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";
import { strapiUpload } from "@/lib/strapi/upload";

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
  revalidateStrapiTags(STRAPI_TAGS.awards);
}

export async function uploadAwardImage(formData: FormData): Promise<number> {
  await assertCanManage();
  const entry = formData.get("file");
  if (!(entry instanceof Blob) || entry.size === 0) {
    throw new Error("invalid");
  }
  const file =
    entry instanceof File
      ? entry
      : new File([entry], "award-image.jpg", {
          type: entry.type || "image/jpeg",
        });
  return strapiUpload(file);
}

export async function createAward(raw: AwardFormInput): Promise<void> {
  await assertCanManage();
  const data = awardFormSchema.parse(raw);
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
  await strapiFetch(`/awards/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data) }),
  });
  invalidateAwards();
}

export async function deleteAward(documentId: string): Promise<void> {
  await assertCanManage();
  await strapiFetch(`/awards/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateAwards();
}
