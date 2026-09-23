"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { crmConnectionSchema } from "@/integrations/crm/settings/schema";
import {
  getCrmConnection,
  upsertCrmConnection,
} from "@/integrations/crm/settings/repo";
import { probeCrmWebhookSecret } from "@/integrations/crm/settings/test-connection";
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

export async function updateCrmConnection(
  formData: FormData,
): Promise<IntegrationSettingsActionResult> {
  try {
    await assertCanManage();
    const values = crmConnectionSchema.parse({
      baseUrl: String(formData.get("baseUrl") ?? ""),
      webhookSecret: String(formData.get("webhookSecret") ?? ""),
    });
    const previous = await getCrmConnection();
    await upsertCrmConnection(values);
    await auditSuccess({
      route: "/settings/integrations/crm",
      verb: "connection",
      entity: "crm",
      before: previous?.baseUrl ?? null,
      after: values.baseUrl,
    });
    revalidateTag("drizzle:crm-connection-settings", "default");
    revalidatePath("/settings/integrations/crm");
    return { ok: true };
  } catch (error) {
    await auditBug({
      route: "/settings/integrations/crm",
      operation: "updateCrmConnection",
      error,
    });
    return { ok: false };
  }
}

export async function testCrmConnection(): Promise<IntegrationSettingsActionResult> {
  try {
    await assertCanManage();
    const connection = await getCrmConnection();
    if (!connection) return { ok: false };
    const accepted = await probeCrmWebhookSecret(connection);
    return accepted ? { ok: true } : { ok: false };
  } catch {
    return { ok: false };
  }
}
