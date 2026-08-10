"use server";

import { auth } from "@/auth";
import {
  resolveKioskPathAfterIdentify,
  type KioskIdentifiedRole,
} from "@/lib/business/kiosk-identify-route";
import { isDrizzleBackend } from "@/lib/db/backend";
import {
  loadKioskDirectoryTeamColaborators,
  loadKioskDirectoryTeams,
  type KioskDirectoryColaborator,
  type KioskDirectoryTeam,
} from "@/lib/kiosk/load-directory";
import { FACE_DESCRIPTOR_LENGTH } from "@/lib/kiosk/face/face-match-constants";
import {
  identifyColaboratorsByFace,
  identifyUserAtKioskByCode,
  identifyUserAtKioskByTag,
  loadKioskWelcomeProfile,
  type KioskWelcomeProfile as DrizzleWelcomeProfile,
} from "@/lib/repos/kiosk";
import { kioskIdentifySchema } from "@/lib/schemas/kiosk-identify";
import { kioskTagIdentifySchema } from "@/lib/schemas/kiosk-tag-identify";
import { toBrowserMediaUrl } from "@/lib/strapi/browser-media-url";
import { strapiFetch } from "@/lib/strapi";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";

interface KioskIdentifyResponse {
  documentId: string;
  role: KioskIdentifiedRole;
  welcome?: {
    name: string;
    greetingGender: "masculine" | "feminine" | null;
    avatarUrl: string | null;
    facePhotoUrl: string | null;
  } | null;
}

export type KioskWelcomeProfile = {
  name: string;
  greetingGender: "masculine" | "feminine" | null;
  avatarUrl: string | null;
  facePhotoUrl: string | null;
};

export type KioskIdentifyResult =
  | {
      ok: true;
      documentId: string;
      role: KioskIdentifiedRole;
      path: string;
      welcome: KioskWelcomeProfile | null;
    }
  | { ok: false; error: "invalidCredentials" | "forbidden" };

function resolveWelcomeFromStrapi(
  welcome: KioskIdentifyResponse["welcome"],
): KioskWelcomeProfile | null {
  if (!welcome?.name) return null;
  return {
    name: welcome.name,
    greetingGender: welcome.greetingGender ?? null,
    avatarUrl: resolveStrapiMediaUrl(welcome.avatarUrl),
    facePhotoUrl: resolveStrapiMediaUrl(welcome.facePhotoUrl),
  };
}

function resolveWelcomeFromDrizzle(
  welcome: DrizzleWelcomeProfile | null,
): KioskWelcomeProfile | null {
  if (!welcome?.name) return null;
  return {
    name: welcome.name,
    greetingGender: welcome.greetingGender,
    avatarUrl: toBrowserMediaUrl(welcome.avatarUrl),
    facePhotoUrl: toBrowserMediaUrl(welcome.facePhotoUrl),
  };
}

function buildIdentifySuccess(
  documentId: string,
  role: KioskIdentifiedRole,
  welcome: KioskWelcomeProfile | null,
): KioskIdentifyResult {
  return {
    ok: true,
    documentId,
    role,
    path: resolveKioskPathAfterIdentify(documentId, role),
    welcome,
  };
}

export async function identifyKioskUserByCode(
  code: number,
  password: string,
): Promise<KioskIdentifyResult> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    return { ok: false, error: "forbidden" };
  }

  const parsed = kioskIdentifySchema.safeParse({ code, password });
  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  if (isDrizzleBackend()) {
    const identified = await identifyUserAtKioskByCode(parsed.data);
    if (!identified) {
      return { ok: false, error: "invalidCredentials" };
    }
    const role = identified.role as KioskIdentifiedRole;
    const welcome = resolveWelcomeFromDrizzle(
      await loadKioskWelcomeProfile(identified.id),
    );
    return buildIdentifySuccess(identified.id, role, welcome);
  }

  let identifyData: KioskIdentifyResponse | undefined;
  try {
    identifyData = await strapiFetch<KioskIdentifyResponse>(
      "/kiosk/identify",
      {
        method: "POST",
        strapiCache: { noStore: true },
        redirectOnUnauthorized: false,
        body: JSON.stringify({
          code: parsed.data.code,
          password: parsed.data.password,
        }),
      },
    );
  } catch {
    return { ok: false, error: "invalidCredentials" };
  }

  if (!identifyData?.documentId || !identifyData.role) {
    return { ok: false, error: "invalidCredentials" };
  }

  return buildIdentifySuccess(
    identifyData.documentId,
    identifyData.role,
    resolveWelcomeFromStrapi(identifyData.welcome),
  );
}

export async function identifyKioskUserByTag(
  rawTag: string,
): Promise<KioskIdentifyResult> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    return { ok: false, error: "forbidden" };
  }

  const parsed = kioskTagIdentifySchema.safeParse({ userTag: rawTag });
  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  if (isDrizzleBackend()) {
    const identified = await identifyUserAtKioskByTag(parsed.data.userTag);
    if (!identified) {
      return { ok: false, error: "invalidCredentials" };
    }
    const role = identified.role as KioskIdentifiedRole;
    const welcome = resolveWelcomeFromDrizzle(
      await loadKioskWelcomeProfile(identified.id),
    );
    return buildIdentifySuccess(identified.id, role, welcome);
  }

  let identifyData: KioskIdentifyResponse | undefined;
  try {
    identifyData = await strapiFetch<KioskIdentifyResponse>(
      "/kiosk/tag-identify",
      {
        method: "POST",
        strapiCache: { noStore: true },
        redirectOnUnauthorized: false,
        body: JSON.stringify({ userTag: parsed.data.userTag }),
      },
    );
  } catch {
    return { ok: false, error: "invalidCredentials" };
  }

  if (!identifyData?.documentId || !identifyData.role) {
    return { ok: false, error: "invalidCredentials" };
  }

  return buildIdentifySuccess(
    identifyData.documentId,
    identifyData.role,
    resolveWelcomeFromStrapi(identifyData.welcome),
  );
}

export async function fetchKioskDirectoryTeams(): Promise<
  { ok: true; teams: KioskDirectoryTeam[] } | { ok: false }
> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    return { ok: false };
  }

  const teams = await loadKioskDirectoryTeams();
  return { ok: true, teams };
}

export async function fetchKioskDirectoryColaborators(
  teamDocumentId: string,
): Promise<
  { ok: true; colaborators: KioskDirectoryColaborator[] } | { ok: false }
> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    return { ok: false };
  }

  const colaborators = await loadKioskDirectoryTeamColaborators(teamDocumentId);
  return { ok: true, colaborators };
}

export type KioskFaceIdentifyCandidate = {
  documentId: string;
  name: string;
  greetingGender: "masculine" | "feminine" | null;
  avatarUrl: string | null;
  facePhotoUrl: string | null;
  faceVector?: number[];
};

export type KioskFaceIdentifyResult =
  | { ok: true; status: "match"; match: KioskFaceIdentifyCandidate }
  | {
      ok: true;
      status: "ambiguous";
      candidates: KioskFaceIdentifyCandidate[];
    }
  | { ok: true; status: "none" }
  | { ok: false; error: "forbidden" | "invalid" };

function resolveCandidateMedia(
  candidate: KioskFaceIdentifyCandidate,
  drizzle: boolean,
): KioskFaceIdentifyCandidate {
  const mapUrl = drizzle ? toBrowserMediaUrl : resolveStrapiMediaUrl;
  return {
    ...candidate,
    avatarUrl: mapUrl(candidate.avatarUrl),
    facePhotoUrl: mapUrl(candidate.facePhotoUrl),
  };
}

export async function identifyKioskUserByFace(
  descriptor: number[],
): Promise<KioskFaceIdentifyResult> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    return { ok: false, error: "forbidden" };
  }

  if (
    !Array.isArray(descriptor) ||
    descriptor.length !== FACE_DESCRIPTOR_LENGTH ||
    descriptor.some((value) => typeof value !== "number" || !Number.isFinite(value))
  ) {
    return { ok: false, error: "invalid" };
  }

  if (isDrizzleBackend()) {
    const outcome = await identifyColaboratorsByFace(descriptor);
    if (outcome.status === "match") {
      return {
        ok: true,
        status: "match",
        match: resolveCandidateMedia(outcome.match, true),
      };
    }
    if (outcome.status === "ambiguous") {
      return {
        ok: true,
        status: "ambiguous",
        candidates: outcome.candidates.map((row) =>
          resolveCandidateMedia(row, true),
        ),
      };
    }
    return { ok: true, status: "none" };
  }

  try {
    const data = await strapiFetch<{
      status: "match" | "ambiguous" | "none";
      match?: KioskFaceIdentifyCandidate;
      candidates?: KioskFaceIdentifyCandidate[];
    }>("/kiosk/face-identify", {
      method: "POST",
      strapiCache: { noStore: true },
      redirectOnUnauthorized: false,
      body: JSON.stringify({ descriptor }),
    });

    if (data.status === "match" && data.match?.documentId) {
      return {
        ok: true,
        status: "match",
        match: resolveCandidateMedia(data.match, false),
      };
    }

    if (data.status === "ambiguous" && Array.isArray(data.candidates)) {
      return {
        ok: true,
        status: "ambiguous",
        candidates: data.candidates
          .filter((row) => row.documentId && row.faceVector)
          .map((row) => resolveCandidateMedia(row, false)),
      };
    }

    return { ok: true, status: "none" };
  } catch {
    return { ok: false, error: "invalid" };
  }
}
