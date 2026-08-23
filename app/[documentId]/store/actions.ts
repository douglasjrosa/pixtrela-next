"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canExchange } from "@/lib/auth/permissions";
import { syncOpenCartDraft } from "@/lib/repos/carts";
import { cartDraftPayloadSchema } from "@/lib/schemas/cart-draft";
import { COLABORATOR_STORE_PAGE_PATH } from "@/lib/store/store-path";

export type CartActionState = {
  ok: boolean;
  messageKey?:
    | "outOfStock"
    | "insufficient"
    | "windowClosed"
    | "emptyCart"
    | "saveFailed";
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
  return "saveFailed";
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
  revalidatePath(COLABORATOR_STORE_PAGE_PATH, "layout");
}

export async function saveCartDraft(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  try {
    const userId = await requireColaboratorId();
    const raw = String(formData.get("payload") ?? "");
    const parsed = cartDraftPayloadSchema.parse(JSON.parse(raw));

    await syncOpenCartDraft({
      userId,
      items: parsed.items,
    });
    revalidateCartTags();
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return { ok: false, messageKey: "saveFailed" };
    }
    return { ok: false, messageKey: mapCartError(error) };
  }
}
