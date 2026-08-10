"use server";

import { auth } from "@/auth";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import type { Role } from "@/lib/auth/nav";
import { isDrizzleBackend } from "@/lib/db/backend";
import { getDb } from "@/lib/db/client";
import { storeMedia } from "@/lib/media/store-media";
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
import { strapiFetch } from "@/lib/strapi";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

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
  | { ok: true; jwt: string; userId: string }
  | { ok: false };

async function assertOwnProfileAccess(): Promise<ProfileAccess> {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;
  if (!userId || !canAccessOwnProfile(role)) {
    return { ok: false };
  }
  if (isDrizzleBackend()) {
    return { ok: true, jwt: session.jwt ?? "", userId };
  }
  if (!session?.jwt) {
    return { ok: false };
  }
  return { ok: true, jwt: session.jwt, userId };
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

  if (isDrizzleBackend()) {
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

  try {
    const response = await fetch(`${STRAPI_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access.jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (response.status === 400) {
      let message = "";
      try {
        const payload = await response.json();
        message = String(payload?.error?.message ?? "");
      } catch {
        message = "";
      }
      if (/current password/i.test(message)) {
        return { ok: false, error: "invalidCurrent" };
      }
      if (/different/i.test(message)) {
        return { ok: false, error: "passwordUnchanged" };
      }
      return { ok: false, error: "failed" };
    }

    if (!response.ok) {
      return { ok: false, error: "failed" };
    }

    const payload = (await response.json()) as { jwt?: string };
    return { ok: true, jwt: payload.jwt };
  } catch {
    return { ok: false, error: "failed" };
  }
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

  if (isDrizzleBackend()) {
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
      return { ok: true, avatarUrl: media.url };
    } catch {
      return { ok: false, error: "failed" };
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const response = await fetch(`${STRAPI_URL}/api/profile/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access.jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileBase64: buffer.toString("base64"),
        mimeType: file.type,
        fileName: file.name || "avatar.jpg",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, error: "failed" };
    }

    const payload = (await response.json()) as { avatarUrl?: string | null };
    return {
      ok: true,
      avatarUrl: resolveStrapiMediaUrl(payload.avatarUrl ?? null),
    };
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

  if (isDrizzleBackend()) {
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
    } catch {
      return { ok: false, error: "failed" };
    }
  }

  try {
    const response = await fetch(`${STRAPI_URL}/api/profile/personal`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${access.jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    if (response.status === 400) {
      let message = "";
      try {
        const payload = await response.json();
        message = String(
          payload?.error?.message ?? payload?.error ?? payload?.message ?? "",
        );
      } catch {
        message = "";
      }
      if (/emailTaken/i.test(message)) {
        return { ok: false, error: "emailTaken" };
      }
      if (/invalidEmail/i.test(message)) {
        return { ok: false, error: "invalidEmail" };
      }
      if (/invalidPhone/i.test(message)) {
        return { ok: false, error: "invalidPhone" };
      }
      return { ok: false, error: "failed" };
    }

    if (!response.ok) {
      return { ok: false, error: "failed" };
    }

    const payload = (await response.json()) as Partial<UpdateOwnPersonalInput>;
    return {
      ok: true,
      name: payload.name ?? parsed.data.name,
      lastName: payload.lastName ?? parsed.data.lastName,
      email: payload.email ?? parsed.data.email,
      phone: payload.phone ?? parsed.data.phone,
    };
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function loadOwnProfileAvatar(): Promise<string | null> {
  const access = await assertOwnProfileAccess();
  if (!access.ok) return null;

  if (isDrizzleBackend()) {
    try {
      return await findUserAvatarUrl(access.userId);
    } catch {
      return null;
    }
  }

  try {
    const me = await strapiFetch<{
      avatar?: { url?: string } | null;
    }>("/users/me", {
      strapiCache: { noStore: true },
    }, {
      populate: { avatar: { fields: ["url"] } },
    });
    return resolveStrapiMediaUrl(me.avatar?.url ?? null);
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

  if (isDrizzleBackend()) {
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

  try {
    const me = await strapiFetch<{
      name?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
    }>("/users/me", {
      strapiCache: { noStore: true },
    }, {
      fields: ["name", "lastName", "email", "phone"],
    });
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
