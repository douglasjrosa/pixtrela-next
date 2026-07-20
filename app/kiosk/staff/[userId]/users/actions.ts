"use server";

import { auth } from "@/auth";
import { kioskColaboratorPasswordSchema } from "@/lib/schemas/kiosk-colaborator-password";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { strapiFetch } from "@/lib/strapi";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

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
    await strapiFetch(
      `/kiosk/staff/users/${staffUserId}/colaborators/${colaboratorDocumentId}/password`,
      {
        method: "POST",
        strapiCache: { noStore: true },
        redirectOnUnauthorized: false,
        body: JSON.stringify({ password: parsed.data.password }),
      },
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "forbidden" };
  }
}

export async function saveKioskColaboratorAvatar(
  staffUserId: string,
  colaboratorDocumentId: string,
  raw: unknown,
): Promise<KioskColaboratorAvatarResult> {
  const session = await auth();
  if (session?.user?.role !== "kiosk" || !session.jwt) {
    return { ok: false, error: "forbidden" };
  }

  if (!(raw instanceof File) || raw.size === 0 || !raw.type.startsWith("image/")) {
    return { ok: false, error: "invalid" };
  }

  const buffer = Buffer.from(await raw.arrayBuffer());
  const response = await fetch(
    `${STRAPI_URL}/api/kiosk/staff/users/${staffUserId}/colaborators/${colaboratorDocumentId}/avatar`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileBase64: buffer.toString("base64"),
        mimeType: raw.type,
        fileName: raw.name,
      }),
    },
  );

  if (!response.ok) {
    return { ok: false, error: "forbidden" };
  }

  const body = (await response.json()) as { avatarUrl?: string | null };
  return {
    ok: true,
    avatarUrl: resolveStrapiMediaUrl(body.avatarUrl ?? null),
  };
}

export async function saveKioskColaboratorFacePhoto(
  staffUserId: string,
  colaboratorDocumentId: string,
  raw: unknown,
): Promise<KioskColaboratorFacePhotoResult> {
  const session = await auth();
  if (session?.user?.role !== "kiosk" || !session.jwt) {
    return { ok: false, error: "forbidden" };
  }

  if (!(raw instanceof File) || raw.size === 0 || !raw.type.startsWith("image/")) {
    return { ok: false, error: "invalid" };
  }

  const buffer = Buffer.from(await raw.arrayBuffer());
  const response = await fetch(
    `${STRAPI_URL}/api/kiosk/staff/users/${staffUserId}/colaborators/${colaboratorDocumentId}/face-photo`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileBase64: buffer.toString("base64"),
        mimeType: raw.type,
        fileName: raw.name,
      }),
    },
  );

  if (!response.ok) {
    return { ok: false, error: "forbidden" };
  }

  const body = (await response.json()) as { facePhotoUrl?: string | null };
  return {
    ok: true,
    facePhotoUrl: resolveStrapiMediaUrl(body.facePhotoUrl ?? null),
  };
}
