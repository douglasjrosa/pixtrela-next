"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canExchange } from "@/lib/auth/permissions";
import { redeemAward as redeemAwardRepo } from "@/lib/repos/exchanges";

export type RedeemAwardState = {
  ok: boolean;
  messageKey?:
    | "success"
    | "insufficient"
    | "redeemFailed"
    | "outOfStock"
    | "windowClosed";
  awardTitle?: string;
};

function mapRedeemError(error: unknown): RedeemAwardState["messageKey"] {
  const detail = error instanceof Error ? error.message : "";
  const lower = detail.toLowerCase();
  if (lower.includes("insufficient")) return "insufficient";
  if (lower.includes("outofstock")) return "outOfStock";
  if (lower.includes("windowclosed")) return "windowClosed";
  return "redeemFailed";
}

/**
 * Redeem an award for the authenticated colaborator via form FormData.
 * Invalidates balance, exchange, and awards caches via revalidateTag.
 */
export async function redeemAward(
  _prev: RedeemAwardState,
  formData: FormData,
): Promise<RedeemAwardState> {
  const session = await auth();
  if (!canExchange(session?.user?.role as Role | undefined)) {
    return { ok: false, messageKey: "redeemFailed" };
  }
  if (!session?.user?.id) {
    return { ok: false, messageKey: "redeemFailed" };
  }

  const awardId = String(formData.get("awardId") ?? "");
  const currencyId = String(formData.get("currencyId") ?? "");
  const qtyRaw = Number(formData.get("qty") ?? 1);
  const qty = Number.isFinite(qtyRaw) ? Math.max(1, Math.floor(qtyRaw)) : 1;
  const awardTitle = String(formData.get("awardTitle") ?? "");

  if (!awardId || !currencyId) {
    return { ok: false, messageKey: "redeemFailed" };
  }

  try {
    await redeemAwardRepo({
      userId: session.user.id,
      awardId,
      currencyId,
      qty,
    });
    revalidateTag("drizzle:exchanges", "default");
    revalidateTag("drizzle:balances", "default");
    revalidateTag("drizzle:awards", "default");
    return { ok: true, messageKey: "success", awardTitle };
  } catch (error) {
    return { ok: false, messageKey: mapRedeemError(error), awardTitle };
  }
}
