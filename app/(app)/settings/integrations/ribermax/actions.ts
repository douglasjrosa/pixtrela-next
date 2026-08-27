"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  ribermaxConnectionSchema,
  upsertRibermaxConnection,
} from "@/integrations/ribermax";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

export async function updateRibermaxConnection(
  formData: FormData,
): Promise<void> {
  await assertCanManage();
  const values = ribermaxConnectionSchema.parse({
    baseUrl: String(formData.get("baseUrl") ?? ""),
    token: String(formData.get("token") ?? ""),
  });
  await upsertRibermaxConnection(values);
  revalidateTag("drizzle:ribermax-connection-settings", "default");
  revalidatePath("/settings/integrations/ribermax");
  redirect("/settings/integrations/ribermax");
}
