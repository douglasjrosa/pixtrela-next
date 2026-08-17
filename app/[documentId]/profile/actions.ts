"use server";

import { auth } from "@/auth";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import type { Role } from "@/lib/auth/nav";
import { getDb } from "@/lib/db/client";
import { storeMedia } from "@/lib/media/store-media";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import {
  changeUserPassword,
  findUserAvatarUrl,
  findUserById,
  setUserAvatarMedia,
  updateUserPersonal,
} from "@/lib/repos/users";
import {
  changeOwnPasswordSchema,
  updateOwnPersonalSchema,
  type ChangeOwnPasswordInput,
  type UpdateOwnPersonalInput,
} from "@/lib/schemas/profile";
import { mediaAssets } from "@/drizzle/schema";

export type ChangeOwnPasswordResult =
  | { ok: true; jwt?: string }
  | {
      ok: false;
      error:
        | "forbidden"
        | "invalid"
        | "invalidCurrent"
        | "passwordMismatch"
        | "passwordUnchanged"
        | "failed";
    };

export type UpdateOwnAvatarResult =
  | { ok: true; avatarUrl: string | null }
  | { ok: false; error: "forbidden" | "invalid" | "failed" };

export type UpdateOwnPersonalResult =
  | ({ ok: true } & UpdateOwnPersonalInput)
  | {
      ok: false;
      error:
        | "forbidden"
        | "invalid"
        | "invalidEmail"
        | "invalidPhone"
        | "emailTaken"
        | "failed";
    };

export type OwnProfilePersonal = UpdateOwnPersonalInput;

type ProfileAccess =
  | { ok: true; userId: string }
  | { ok: false };

async function assertOwnProfileAccess(): Promise<ProfileAccess> {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;
  if (!userId || !canAccessOwnProfile(role)) {
    return { ok: false };
  }
  return { ok: true, userId };
}

export async function changeOwnPassword(
  raw: unknown,
): Promise<ChangeOwnPasswordResult> {
  const access = await assertOwnProfileAccess();
  if (!access.ok) {
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

  const body: ChangeOwnPasswordInput = parsed.data;

  const result = await changeUserPassword({
    id: access.userId,
    currentPassword: body.currentPassword,
    newPassword: body.password,
  });
  if (result === "invalidCurrent") {
    return { ok: false, error: "invalidCurrent" };
  }
  if (result !== "ok") {
    return { ok: false, error: "failed" };
  }
  return { ok: true };
}

export async function updateOwnAvatar(
  file: File,
): Promise<UpdateOwnAvatarResult> {
  const access = await assertOwnProfileAccess();
  if (!access.ok) {
    return { ok: false, error: "forbidden" };
  }

  if (!(file instanceof File) || file.size === 0 || !file.type.startsWith("image/")) {
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
    await setUserAvatarMedia(access.userId, media.id);
    return { ok: true, avatarUrl: toBrowserMediaUrl(media.url) };
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function updateOwnPersonal(
  raw: unknown,
): Promise<UpdateOwnPersonalResult> {
  const access = await assertOwnProfileAccess();
  if (!access.ok) {
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
      id: access.userId,
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

export async function loadOwnProfileAvatar(): Promise<string | null> {
  const access = await assertOwnProfileAccess();
  if (!access.ok) return null;

  try {
    const url = await findUserAvatarUrl(access.userId);
    return url ? toBrowserMediaUrl(url) : null;
  } catch {
    return null;
  }
}

export async function loadOwnProfilePersonal(): Promise<OwnProfilePersonal> {
  const empty: OwnProfilePersonal = {
    name: "",
    lastName: "",
    email: "",
    phone: "",
  };
  const access = await assertOwnProfileAccess();
  if (!access.ok) return empty;

  try {
    const me = await findUserById(access.userId);
    if (!me) return empty;
    return {
      name: me.name ?? "",
      lastName: me.lastName ?? "",
      email: me.email ?? "",
      phone: me.phone ?? "",
    };
  } catch {
    return empty;
  }
}
