"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  removeCartItemAction,
  updateCartItemQty,
  type CartActionState,
} from "@/app/[documentId]/store/actions";
import {
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
