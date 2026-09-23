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
import { auditBug, auditSuccess } from "@/lib/logs/record-log";

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
    const previous = await getRibermaxConnection();
    await upsertRibermaxConnection(values);
    await auditSuccess({
      route: "/settings/integrations/ribermax",
      verb: "connection",
      entity: "ribermax",
      before: previous?.baseUrl ?? null,
      after: values.baseUrl,
    });
    revalidateTag("drizzle:ribermax-connection-settings", "default");
    revalidatePath("/settings/integrations/ribermax");
    return { ok: true };
  } catch (error) {
    await auditBug({
      route: "/settings/integrations/ribermax",
      operation: "updateRibermaxConnection",
      error,
    });
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
