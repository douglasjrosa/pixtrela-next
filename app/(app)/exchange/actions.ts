"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canExchange } from "@/lib/auth/permissions";
import { isDrizzleBackend } from "@/lib/db/backend";
import { redeemAward as redeemAwardRepo } from "@/lib/repos/exchanges";
import { balanceTag, STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

/**
 * Redeem an award for the authenticated colaborator. Invalidates balance and
 * exchange caches via revalidateTag (not revalidatePath).
 */
export async function redeemAward(awardId: string, currency: string, qty: number) {
  const session = await auth();
  if (!canExchange(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }

  if (isDrizzleBackend()) {
    if (!session?.user?.id) {
      throw new Error("forbidden");
    }
    await redeemAwardRepo({
      userId: session.user.id,
      awardId,
      currencyId: currency,
      qty,
    });
    revalidateTag("drizzle:exchanges");
    revalidateTag("drizzle:balances");
    return;
  }

  await strapiFetch("/exchanges", {
    strapiCache: { noStore: true },
    method: "POST",
    body: JSON.stringify({ data: { awardId, currency, qty } }),
  });

  const tags: string[] = [STRAPI_TAGS.exchanges, STRAPI_TAGS.awards];
  if (session?.user?.id) {
    tags.push(balanceTag(session.user.id));
  }
  revalidateStrapiTags(...tags);
}
