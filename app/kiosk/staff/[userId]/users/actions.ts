"use server";

import { auth } from "@/auth";
import {
  createAvatarDebugTrace,
  emitAvatarDebugLog,
  pushAvatarDebugStep,
  type KioskAvatarDebugTrace,
} from "@/lib/debug/kiosk-avatar-debug";
import { kioskColaboratorPasswordSchema } from "@/lib/schemas/kiosk-colaborator-password";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { strapiFetch } from "@/lib/strapi";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

export type KioskColaboratorPasswordResult =
  | { ok: true }
  | { ok: false; error: "forbidden" | "invalid" | "passwordMismatch" };

export type KioskColaboratorAvatarResult =
  | { ok: true; avatarUrl: string | null; debug: KioskAvatarDebugTrace }
  | {
      ok: false;
      error: "forbidden" | "invalid";
      debug: KioskAvatarDebugTrace;
    };

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

function readStrapiHost(): string {
  try {
    return new URL(STRAPI_URL).host;
  } catch {
    return "invalid-strapi-url";
  }
}

export async function saveKioskColaboratorAvatar(
  staffUserId: string,
  colaboratorDocumentId: string,
  raw: unknown,
): Promise<KioskColaboratorAvatarResult> {
  const debug = createAvatarDebugTrace();

  pushAvatarDebugStep(
    debug,
    "action:start",
    { staffUserId, colaboratorDocumentId, strapiHost: readStrapiHost() },
  );

  const session = await auth();
  pushAvatarDebugStep(
    debug,
    "action:session",
    {
      role: session?.user?.role ?? null,
      hasJwt: Boolean(session?.jwt),
    },
    "A",
  );

  if (session?.user?.role !== "kiosk" || !session.jwt) {
    emitAvatarDebugLog(debug, "actions.ts:session", "session rejected");
    return { ok: false, error: "forbidden", debug };
  }

  const isFile = raw instanceof File;
  pushAvatarDebugStep(
    debug,
    "action:file-check",
    {
      isFile,
      size: isFile ? raw.size : null,
      type: isFile ? raw.type : null,
      name: isFile ? raw.name : null,
    },
    "B",
  );

  if (!isFile || raw.size === 0 || !raw.type.startsWith("image/")) {
    emitAvatarDebugLog(debug, "actions.ts:file", "file rejected");
    return { ok: false, error: "invalid", debug };
  }

  const buffer = Buffer.from(await raw.arrayBuffer());
  const payloadBytes = buffer.length;
  const base64Length = buffer.toString("base64").length;

  pushAvatarDebugStep(debug, "action:payload-ready", {
    payloadBytes,
    base64Length,
    mimeType: raw.type,
    fileName: raw.name,
  });

  const endpoint =
    `${STRAPI_URL}/api/kiosk/staff/users/${staffUserId}` +
    `/colaborators/${colaboratorDocumentId}/avatar`;

  const response = await fetch(endpoint, {
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
  });

  const responseText = await response.text();
  let responseBody: unknown = null;
  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = { raw: responseText.slice(0, 500) };
  }

  pushAvatarDebugStep(
    debug,
    "action:strapi-response",
    {
      status: response.status,
      ok: response.ok,
      body: responseBody,
    },
    "C",
  );

  if (!response.ok) {
    emitAvatarDebugLog(debug, "actions.ts:strapi-error", "strapi not ok");
    return { ok: false, error: "forbidden", debug };
  }

  const body = responseBody as {
    avatarUrl?: string | null;
    debug?: KioskAvatarDebugTrace;
  };

  if (body.debug?.steps?.length) {
    debug.steps.push(...body.debug.steps);
  }

  const resolvedUrl = resolveStrapiMediaUrl(body.avatarUrl ?? null);

  pushAvatarDebugStep(
    debug,
    "action:resolved-url",
    {
      rawAvatarUrl: body.avatarUrl ?? null,
      resolvedAvatarUrl: resolvedUrl,
    },
    "E",
  );

  emitAvatarDebugLog(debug, "actions.ts:success", "avatar saved");

  return {
    ok: true,
    avatarUrl: resolvedUrl,
    debug,
  };
}
