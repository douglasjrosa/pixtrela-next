"use server";

import { assertKioskStaffActor } from "@/lib/business/kiosk-staff-access";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { storeMedia } from "@/lib/media/store-media";
import { insertMediaAsset } from "@/lib/repos/media";
import {
  changeUserPassword,
  setUserAvatarMedia,
  updateUserPersonal,
} from "@/lib/repos/users";
import {
  changeOwnPasswordSchema,
  updateOwnPersonalSchema,
} from "@/lib/schemas/profile";

import type {
  ChangeOwnPasswordResult,
  UpdateOwnAvatarResult,
  UpdateOwnPersonalResult,
} from "@/app/[documentId]/profile/actions";

async function assertStaffActor(staffUserId: string): Promise<boolean> {
  try {
    await assertKioskStaffActor(staffUserId);
    return true;
  } catch {
    return false;
  }
}

export async function changeStaffPassword(
  staffUserId: string,
  raw: unknown,
): Promise<ChangeOwnPasswordResult> {
  if (!(await assertStaffActor(staffUserId))) {
    return { ok: false, error: "forbidden" };
  }

  const parsed = changeOwnPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some(
      (issue) => issue.message === "passwordMismatch",
    );
    const unchanged = parsed.error.issues.some(
      (issue) => issue.message === "passwordUnchanged",
    );
    if (mismatch) return { ok: false, error: "passwordMismatch" };
    if (unchanged) return { ok: false, error: "passwordUnchanged" };
    return { ok: false, error: "invalid" };
  }

  const result = await changeUserPassword({
    id: staffUserId,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.password,
  });
  if (result === "invalidCurrent") {
    return { ok: false, error: "invalidCurrent" };
  }
  if (result !== "ok") {
    return { ok: false, error: "failed" };
  }
  // No jwt is returned: the active session belongs to the kiosk device, not
  // the staff human, so we must not re-sign-in on save.
  return { ok: true };
}

export async function updateStaffAvatar(
  staffUserId: string,
  file: File,
): Promise<UpdateOwnAvatarResult> {
  if (!(await assertStaffActor(staffUserId))) {
    return { ok: false, error: "forbidden" };
  }

  if (
    !(file instanceof File) ||
    file.size === 0 ||
    !file.type.startsWith("image/")
  ) {
    return { ok: false, error: "invalid" };
  }

  try {
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
    await setUserAvatarMedia(staffUserId, media.id);
    return { ok: true, avatarUrl: toBrowserMediaUrl(media.url) };
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function updateStaffPersonal(
  staffUserId: string,
  raw: unknown,
): Promise<UpdateOwnPersonalResult> {
  if (!(await assertStaffActor(staffUserId))) {
    return { ok: false, error: "forbidden" };
  }

  const parsed = updateOwnPersonalSchema.safeParse(raw);
  if (!parsed.success) {
    const invalidEmail = parsed.error.issues.some(
      (issue) =>
        issue.message === "invalidEmail" || issue.path.includes("email"),
    );
    const invalidPhone = parsed.error.issues.some(
      (issue) =>
        issue.message === "invalidPhone" || issue.path.includes("phone"),
    );
    if (invalidEmail) return { ok: false, error: "invalidEmail" };
    if (invalidPhone) return { ok: false, error: "invalidPhone" };
    return { ok: false, error: "invalid" };
  }

  try {
    const updated = await updateUserPersonal({
      id: staffUserId,
      name: parsed.data.name,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      email: parsed.data.email,
    });
    return {
      ok: true,
      name: updated.name,
      lastName: updated.lastName ?? "",
      email: updated.email ?? "",
      phone: updated.phone ?? "",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "emailTaken") {
      return { ok: false, error: "emailTaken" };
    }
    return { ok: false, error: "failed" };
  }
}
