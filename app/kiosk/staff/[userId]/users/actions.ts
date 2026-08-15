"use server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import { storeMedia } from "@/lib/media/store-media";
import {
  assertStaffCanManageColaborator,
} from "@/lib/repos/kiosk";
import {
  setColaboratorPasswordByStaff,
  setUserAvatarMedia,
  setUserFacePhotoMedia,
} from "@/lib/repos/users";
import { mediaAssets } from "@/drizzle/schema";
import { kioskColaboratorPasswordSchema } from "@/lib/schemas/kiosk-colaborator-password";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

export type KioskColaboratorPasswordResult =
  | { ok: true }
  | { ok: false; error: "forbidden" | "invalid" | "passwordMismatch" };

export type KioskColaboratorAvatarResult =
  | { ok: true; avatarUrl: string | null }
  | { ok: false; error: "forbidden" | "invalid" };

export type KioskColaboratorFacePhotoResult =
  | { ok: true; facePhotoUrl: string | null }
  | { ok: false; error: "forbidden" | "invalid" };

export async function saveKioskColaboratorPassword(
  staffUserId: string,
  colaboratorDocumentId: string,
  raw: unknown,
): Promise<KioskColaboratorPasswordResult> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    return { ok: false, error: "forbidden" };
  }

  const parsed = kioskColaboratorPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some(
      (issue) => issue.message === "passwordMismatch",
    );
    return { ok: false, error: mismatch ? "passwordMismatch" : "invalid" };
  }

  try {
    await assertStaffCanManageColaborator(staffUserId, colaboratorDocumentId);
    await setColaboratorPasswordByStaff(
      colaboratorDocumentId,
      parsed.data.password,
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "forbidden" };
  }
}

async function storeAvatarForColaborator(
  colaboratorDocumentId: string,
  file: File,
): Promise<string | null> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.type.includes("png") ? "png" : "jpg";
  const stored = await storeMedia({
    bytes: buffer,
    mimeType: file.type,
    extension,
  });
  const db = getDb();
  const [media] = await db
    .insert(mediaAssets)
    .values({
      storageKey: stored.storageKey,
      url: stored.url,
      mimeType: stored.mimeType,
      byteSize: stored.byteSize,
    })
    .returning({ id: mediaAssets.id, url: mediaAssets.url });
  await setUserAvatarMedia(colaboratorDocumentId, media.id);
  return media.url;
}

async function storeFacePhotoForColaborator(
  colaboratorDocumentId: string,
  file: File,
  faceVector?: number[],
): Promise<string | null> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.type.includes("png") ? "png" : "jpg";
  const stored = await storeMedia({
    bytes: buffer,
    mimeType: file.type,
    extension,
  });
  const db = getDb();
  const [media] = await db
    .insert(mediaAssets)
    .values({
      storageKey: stored.storageKey,
      url: stored.url,
      mimeType: stored.mimeType,
      byteSize: stored.byteSize,
    })
    .returning({ id: mediaAssets.id, url: mediaAssets.url });
  await setUserFacePhotoMedia(
    colaboratorDocumentId,
    media.id,
    faceVector ?? null,
  );
  return media.url;
}

export async function saveKioskColaboratorAvatar(
  staffUserId: string,
  colaboratorDocumentId: string,
  raw: unknown,
): Promise<KioskColaboratorAvatarResult> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    return { ok: false, error: "forbidden" };
  }

  if (!(raw instanceof File) || raw.size === 0 || !raw.type.startsWith("image/")) {
    return { ok: false, error: "invalid" };
  }

  try {
    await assertStaffCanManageColaborator(staffUserId, colaboratorDocumentId);
    const avatarUrl = await storeAvatarForColaborator(
      colaboratorDocumentId,
      raw,
    );
    return { ok: true, avatarUrl: toBrowserMediaUrl(avatarUrl) };
  } catch {
    return { ok: false, error: "forbidden" };
  }
}

export async function saveKioskColaboratorFacePhoto(
  staffUserId: string,
  colaboratorDocumentId: string,
  raw: unknown,
  faceVector?: number[],
): Promise<KioskColaboratorFacePhotoResult> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    return { ok: false, error: "forbidden" };
  }

  if (!(raw instanceof File) || raw.size === 0 || !raw.type.startsWith("image/")) {
    return { ok: false, error: "invalid" };
  }

  try {
    await assertStaffCanManageColaborator(staffUserId, colaboratorDocumentId);
    const facePhotoUrl = await storeFacePhotoForColaborator(
      colaboratorDocumentId,
      raw,
      faceVector,
    );
    return { ok: true, facePhotoUrl: toBrowserMediaUrl(facePhotoUrl) };
  } catch {
    return { ok: false, error: "forbidden" };
  }
}
