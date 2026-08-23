"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  checkoutCartAction,
  removeCartItemAction,
  updateCartItemQty,
  type CartActionState,
} from "@/app/[documentId]/store/actions";
import {
  CartCheckoutSubmitButton,
  CartQtySubmitButton,
  CartRemoveSubmitButton,
} from "@/components/store/cart-form-buttons";

const INITIAL: CartActionState = { ok: false };

export function CartQtyForms({
  itemId,
  qty,
  stock,
}: {
  itemId: string;
  qty: number;
  stock: number;
}) {
  const t = useTranslations("cart");
  const [, decAction] = useActionState(updateCartItemQty, INITIAL);
  const [, incAction] = useActionState(updateCartItemQty, INITIAL);

  return (
    <div className="flex items-center gap-2">
      <form action={decAction}>
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="qty" value={String(qty - 1)} />
        <CartQtySubmitButton label="−" />
      </form>
      <span className="min-w-8 text-center tabular-nums font-semibold">
        {qty}
      </span>
      <form action={incAction}>
        <input type="hidden" name="itemId" value={itemId} />
        <input
          type="hidden"
          name="qty"
          value={String(Math.min(stock, qty + 1))}
        />
        <CartQtySubmitButton label="+" />
      </form>
      <span className="sr-only">{t("qty")}</span>
    </div>
  );
}

export function CartRemoveForm({ itemId }: { itemId: string }) {
  const [, formAction] = useActionState(removeCartItemAction, INITIAL);
  return (
    <form action={formAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <CartRemoveSubmitButton />
    </form>
  );
}

export function CartCheckoutForm({
  disabled,
  errorKey,
}: {
  disabled: boolean;
  errorKey?: CartActionState["messageKey"];
}) {
  const t = useTranslations("cart");
  const [state, formAction] = useActionState(checkoutCartAction, INITIAL);
  const key = state.messageKey ?? errorKey;

  let message: string | null = null;
  if (key === "insufficient") message = t("insufficient");
  else if (key === "outOfStock") message = t("outOfStock");
  else if (key === "windowClosed") message = t("windowClosed");
  else if (key === "emptyCart") message = t("emptyCart");
  else if (key === "checkoutFailed") message = t("checkoutFailed");

  return (
    <form action={formAction} className="space-y-2">
      <CartCheckoutSubmitButton disabled={disabled} />
      {message ? (
        <p role="status" className="text-sm font-medium text-destructive">
          {message}
        </p>
      ) : null}
    </form>
  );
}
