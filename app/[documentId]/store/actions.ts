"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canExchange } from "@/lib/auth/permissions";
import {
  addCartItem,
  removeCartItem,
  setCartItemQty,
} from "@/lib/repos/carts";
import { checkoutCart as checkoutCartRepo } from "@/lib/repos/exchange-orders";
import { buildStoreOrderPath } from "@/lib/store/store-path";

export type CartActionState = {
  ok: boolean;
  messageKey?:
    | "addedToCart"
    | "addFailed"
    | "outOfStock"
    | "checkoutFailed"
    | "insufficient"
    | "windowClosed"
    | "emptyCart";
};

function mapCartError(error: unknown): CartActionState["messageKey"] {
  const detail = error instanceof Error ? error.message : "";
  const lower = detail.toLowerCase();
  if (lower.includes("outofstock")) return "outOfStock";
  if (lower.includes("insufficient")) return "insufficient";
  if (lower.includes("windowclosed") || lower.includes("noteam")) {
    return "windowClosed";
  }
  if (lower.includes("cartempty")) return "emptyCart";
  return "addFailed";
}

function mapCheckoutError(error: unknown): CartActionState["messageKey"] {
  const key = mapCartError(error);
  if (key === "addFailed") return "checkoutFailed";
  return key;
}

async function requireColaboratorId(): Promise<string> {
  const session = await auth();
  if (!canExchange(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
  if (!session?.user?.id) throw new Error("forbidden");
  return session.user.id;
}

function revalidateCartTags(): void {
  revalidateTag("drizzle:carts", "default");
  revalidateTag("drizzle:awards", "default");
}

export async function addToCart(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  try {
    const userId = await requireColaboratorId();
    const awardId = String(formData.get("awardId") ?? "");
    const qtyRaw = Number(formData.get("qty") ?? 1);
    const qty = Number.isFinite(qtyRaw) ? Math.max(1, Math.floor(qtyRaw)) : 1;
    if (!awardId) return { ok: false, messageKey: "addFailed" };

    await addCartItem({ userId, awardId, qty });
    revalidateCartTags();
    return { ok: true, messageKey: "addedToCart" };
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return { ok: false, messageKey: "addFailed" };
    }
    return { ok: false, messageKey: mapCartError(error) };
  }
}

export async function updateCartItemQty(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  try {
    const userId = await requireColaboratorId();
    const itemId = String(formData.get("itemId") ?? "");
    const qtyRaw = Number(formData.get("qty") ?? 1);
    if (!itemId) return { ok: false, messageKey: "addFailed" };

    await setCartItemQty({
      userId,
      itemId,
      qty: Number.isFinite(qtyRaw) ? Math.floor(qtyRaw) : 1,
    });
    revalidateCartTags();
    return { ok: true };
  } catch (error) {
    return { ok: false, messageKey: mapCartError(error) };
  }
}

export async function removeCartItemAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  try {
    const userId = await requireColaboratorId();
    const itemId = String(formData.get("itemId") ?? "");
    if (!itemId) return { ok: false, messageKey: "addFailed" };
    await removeCartItem({ userId, itemId });
    revalidateCartTags();
    return { ok: true };
  } catch (error) {
    return { ok: false, messageKey: mapCartError(error) };
  }
}

export async function checkoutCartAction(
  _prev: CartActionState,
  _formData: FormData,
): Promise<CartActionState> {
  try {
    const userId = await requireColaboratorId();
    const result = await checkoutCartRepo({ userId });
    revalidateTag("drizzle:carts", "default");
    revalidateTag("drizzle:awards", "default");
    revalidateTag("drizzle:balances", "default");
    revalidateTag("drizzle:exchanges", "default");
    revalidateTag("drizzle:exchange-orders", "default");
    redirect(`${buildStoreOrderPath(userId, result.orderId)}?placed=1`);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    if (error instanceof Error && error.message === "forbidden") {
      return { ok: false, messageKey: "checkoutFailed" };
    }
    return { ok: false, messageKey: mapCheckoutError(error) };
  }
}
