"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canExchange } from "@/lib/auth/permissions";
import { redeemAward as redeemAwardRepo } from "@/lib/repos/exchanges";

/**
 * Redeem an award for the authenticated colaborator. Invalidates balance and
 * exchange caches via revalidateTag (not revalidatePath).
 */
export async function redeemAward(awardId: string, currency: string, qty: number) {
  const session = await auth();
  if (!canExchange(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
  if (!session?.user?.id) {
    throw new Error("forbidden");
  }
  await redeemAwardRepo({
    userId: session.user.id,
    awardId,
    currencyId: currency,
    qty,
  });
  revalidateTag("drizzle:exchanges", "default");
  revalidateTag("drizzle:balances", "default");
}
