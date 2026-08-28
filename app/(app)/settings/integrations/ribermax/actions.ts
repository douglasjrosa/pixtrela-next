"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import {
  getRibermaxConnection,
  ribermaxConnectionSchema,
  upsertRibermaxConnection,
} from "@/integrations/ribermax";
import { probeRibermaxConnection } from "@/integrations/ribermax/settings/test-connection";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import type { IntegrationSettingsActionResult } from "@/lib/integrations/settings-action-result";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

export async function updateRibermaxConnection(
  formData: FormData,
): Promise<IntegrationSettingsActionResult> {
  try {
    await assertCanManage();
    const values = ribermaxConnectionSchema.parse({
      baseUrl: String(formData.get("baseUrl") ?? ""),
      token: String(formData.get("token") ?? ""),
    });
    await upsertRibermaxConnection(values);
    revalidateTag("drizzle:ribermax-connection-settings", "default");
    revalidatePath("/settings/integrations/ribermax");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function testRibermaxConnection(): Promise<IntegrationSettingsActionResult> {
  try {
    await assertCanManage();
    const connection = await getRibermaxConnection();
    if (!connection) return { ok: false };
    const reachable = await probeRibermaxConnection(connection);
    return reachable ? { ok: true } : { ok: false };
  } catch {
    return { ok: false };
  }
}
