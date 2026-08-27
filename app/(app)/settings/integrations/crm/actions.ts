"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { crmConnectionSchema } from "@/integrations/crm/settings/schema";
import { upsertCrmWebhookSecret } from "@/integrations/crm/settings/repo";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

export async function updateCrmConnection(
  formData: FormData,
): Promise<void> {
  await assertCanManage();
  const values = crmConnectionSchema.parse({
    webhookSecret: String(formData.get("webhookSecret") ?? ""),
  });
  await upsertCrmWebhookSecret(values.webhookSecret);
  revalidateTag("drizzle:crm-connection-settings", "default");
  revalidatePath("/settings/integrations/crm");
  redirect("/settings/integrations/crm");
}
