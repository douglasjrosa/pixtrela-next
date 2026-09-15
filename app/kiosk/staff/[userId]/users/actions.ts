"use server";

import { auth } from "@/auth";
import { storeMedia } from "@/lib/media/store-media";
import { assertStaffColaboratorEditAccess } from "@/lib/kiosk/staff-colaborator-edit-access";
import { assertStaffCanManageColaborator } from "@/lib/repos/kiosk";
import { insertMediaAsset } from "@/lib/repos/media";
import {
  findUserById,
  setColaboratorPasswordByStaff,
  setUserAvatarMedia,
  setUserFacePhotoMedia,
} from "@/lib/repos/users";
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
  const parsed = kioskColaboratorPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some(
      (issue) => issue.message === "passwordMismatch",
    );
    return { ok: false, error: mismatch ? "passwordMismatch" : "invalid" };
  }

  try {
    await assertStaffColaboratorEditAccess(staffUserId, colaboratorDocumentId);
    await setColaboratorPasswordByStaff(
      colaboratorDocumentId,
      parsed.data.password,
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "forbidden" };
  }
}

/**
 * Self-service password change on the kiosk device. The colaborator is
 * identified on the kiosk home screen (code + password), so no staff
 * management assertion is required — only the kiosk device session plus a
 * check that the target really is an active colaborator.
 */
export async function saveKioskOwnColaboratorPassword(
  colaboratorId: string,
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
    const target = await findUserById(colaboratorId);
    if (
      !target ||
      target.role !== "colaborator" ||
      !target.active ||
      target.blocked
    ) {
      return { ok: false, error: "forbidden" };
    }
    await setColaboratorPasswordByStaff(colaboratorId, parsed.data.password);
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
  const media = await insertMediaAsset(stored, {
    originalFilename: file.name?.trim() || null,
    category: "avatar",
    sensitivity: "internal",
  });
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
  const media = await insertMediaAsset(stored, {
    originalFilename: file.name?.trim() || null,
    category: "face",
    sensitivity: "biometric",
  });
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
  if (!(raw instanceof File) || raw.size === 0 || !raw.type.startsWith("image/")) {
    return { ok: false, error: "invalid" };
  }

  try {
    await assertStaffColaboratorEditAccess(staffUserId, colaboratorDocumentId);
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
