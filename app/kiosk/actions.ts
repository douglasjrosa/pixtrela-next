"use server";

import { auth } from "@/auth";
import {
  resolveKioskPathAfterIdentify,
  type KioskIdentifiedRole,
} from "@/lib/business/kiosk-identify-route";
import {
  loadKioskDirectoryTeamColaborators,
  loadKioskDirectoryTeams,
  type KioskDirectoryColaborator,
  type KioskDirectoryTeam,
} from "@/lib/kiosk/load-directory";
import { kioskIdentifySchema } from "@/lib/schemas/kiosk-identify";
import { strapiFetch } from "@/lib/strapi";

interface KioskIdentifyResponse {
  documentId: string;
  role: KioskIdentifiedRole;
}

export type KioskIdentifyResult =
  | { ok: true; documentId: string; role: KioskIdentifiedRole; path: string }
  | { ok: false; error: "invalidCredentials" | "forbidden" };

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

  return {
    ok: true,
    documentId: identifyData.documentId,
    role: identifyData.role,
    path: resolveKioskPathAfterIdentify(
      identifyData.documentId,
      identifyData.role,
    ),
  };
}

/** @deprecated Use identifyKioskUserByCode */
export async function identifyColaboratorByCode(
  code: number,
  password: string,
): Promise<
  | { ok: true; colaboratorId: string }
  | { ok: false; error: "invalidCredentials" | "forbidden" }
> {
  const result = await identifyKioskUserByCode(code, password);
  if (!result.ok) return result;
  if (result.role !== "colaborator") {
    return { ok: false, error: "invalidCredentials" };
  }
  return { ok: true, colaboratorId: result.documentId };
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
