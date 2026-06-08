"use server";

import { auth } from "@/auth";
import { kioskIdentifySchema } from "@/lib/schemas/kiosk-identify";
import { strapiFetch } from "@/lib/strapi";

interface KioskIdentifyResponse {
  colaboratorId: string;
}

export type KioskIdentifyResult =
  | { ok: true; colaboratorId: string }
  | { ok: false; error: "invalidCredentials" | "forbidden" };

export async function identifyColaboratorByCode(
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

  if (!identifyData?.colaboratorId) {
    return { ok: false, error: "invalidCredentials" };
  }

  return { ok: true, colaboratorId: identifyData.colaboratorId };
}
