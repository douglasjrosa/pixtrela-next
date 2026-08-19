"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  addToCart,
  type CartActionState,
} from "@/app/[documentId]/store/actions";
import { StoreAddToCartSubmitButton } from "@/components/store/store-add-to-cart-submit-button";

const INITIAL_STATE: CartActionState = { ok: false };

export interface StoreAddToCartFormProps {
  awardId: string;
  inStock: boolean;
  hasCost: boolean;
  compact?: boolean;
}

export function StoreAddToCartForm({
  awardId,
  inStock,
  hasCost,
  compact = false,
}: StoreAddToCartFormProps) {
  const t = useTranslations("store");
  const tExchange = useTranslations("exchange");
  const [state, formAction] = useActionState(addToCart, INITIAL_STATE);

  let statusMessage: string | null = null;
  if (state.messageKey === "addedToCart") {
    statusMessage = t("addedToCart");
  } else if (state.messageKey === "outOfStock") {
    statusMessage = tExchange("outOfStock");
  } else if (state.messageKey === "addFailed") {
    statusMessage = t("addFailed");
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="awardId" value={awardId} />
      <input type="hidden" name="qty" value="1" />
      <StoreAddToCartSubmitButton
        inStock={inStock}
        hasCost={hasCost}
        compact={compact}
      />
      {statusMessage ? (
        <p
          role="status"
          className="text-sm font-medium text-[var(--star-gold-foreground)]"
        >
          {statusMessage}
        </p>
      ) : null}
    </form>
  );
}
