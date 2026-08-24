"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  ribermaxBoxTemplateRatesSchema,
  upsertBoxTemplateRates,
} from "@/integrations/ribermax";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function formNumber(formData: FormData, name: string): number {
  const value = formData.get(name);
  return Number(typeof value === "string" ? value : "");
}

export async function updateRibermaxBoxTemplateRates(
  formData: FormData,
): Promise<void> {
  await assertCanManage();
  const values = ribermaxBoxTemplateRatesSchema.parse({
    cutSeconds: formNumber(formData, "cutSeconds"),
    adhesiveSeconds: formNumber(formData, "adhesiveSeconds"),
    fastenerSeconds: formNumber(formData, "fastenerSeconds"),
  });
  await upsertBoxTemplateRates(values);
  revalidateTag("drizzle:ribermax-box-template-settings", "default");
  revalidatePath("/settings/integrations/ribermax");
  redirect("/settings/integrations/ribermax");
}
