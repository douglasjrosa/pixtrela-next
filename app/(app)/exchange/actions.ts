"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canExchange } from "@/lib/auth/permissions";
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
