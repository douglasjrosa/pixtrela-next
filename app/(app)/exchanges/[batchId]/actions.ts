"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canUpdateExchangeShoppingPrices } from "@/lib/auth/permissions";
import { updateAwardActualPrices } from "@/lib/repos/awards";
import { shoppingPriceUpdatesSchema } from "@/lib/schemas/shopping-prices";

async function assertCanUpdatePrices(): Promise<void> {
  const session = await auth();
  if (
    !canUpdateExchangeShoppingPrices(session?.user?.role as Role | undefined)
  ) {
    throw new Error("forbidden");
  }
}

export async function updateShoppingListPrices(
  batchId: string,
  raw: unknown,
): Promise<void> {
  await assertCanUpdatePrices();
  const data = shoppingPriceUpdatesSchema.parse(raw);
  await updateAwardActualPrices(
    data.awards.map((award) => ({
      awardId: award.awardId,
      actualPrice: award.actualPrice,
    })),
  );
  revalidateTag("drizzle:awards", "default");
  revalidatePath(`/exchanges/${batchId}`);
}
