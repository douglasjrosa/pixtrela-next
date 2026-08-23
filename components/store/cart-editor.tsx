"use client";

import { Package, Star } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  saveCartDraft,
  type CartActionState,
} from "@/app/[documentId]/store/actions";
import { CartQtyButton } from "@/components/store/cart-form-buttons";
import { Button } from "@/components/ui/button";
import { canAffordCart } from "@/lib/domain/cart";
import { showErrorToast } from "@/lib/ui/app-toast";
import {
  clampDraftQty,
  computeCartDraftTotal,
  isCartDraftDirty,
  mapCartDraftLines,
  serializeCartDraftPayload,
  type CartDraftItem,
} from "@/lib/store/cart-draft";

const INITIAL: CartActionState = { ok: false };

export type CartEditorProps = {
  initialItems: CartDraftItem[];
  spendableBalance: number;
  currencyLabel?: string;
  editable?: boolean;
};

export function CartEditor({
  initialItems,
  spendableBalance,
  currencyLabel,
  editable = true,
}: CartEditorProps) {
  const t = useTranslations("cart");
  const tCommon = useTranslations("common");
  const [baseline, setBaseline] = useState(initialItems);
  const [draft, setDraft] = useState(initialItems);
  const [state, saveAction, saving] = useActionState(saveCartDraft, INITIAL);

  useEffect(() => {
    setBaseline(initialItems);
    setDraft(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (!state.ok && state.messageKey) {
      showErrorToast(t(state.messageKey));
    }
  }, [state, t]);

  const lines = useMemo(() => mapCartDraftLines(draft), [draft]);
  const total = useMemo(() => computeCartDraftTotal(draft), [draft]);
  const dirty = isCartDraftDirty(baseline, draft);
  const affordable = canAffordCart(spendableBalance, total);
  const remaining = Math.max(0, total - spendableBalance);

  const updateQty = (itemId: string, nextQty: number) => {
    setDraft((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, qty: clampDraftQty(nextQty, item.stock) }
          : item,
      ),
    );
  };

  if (draft.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <p className="text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <form action={saveAction} className="space-y-6">
      <input
        type="hidden"
        name="payload"
        value={serializeCartDraftPayload(draft)}
        readOnly
      />

      <ul className="space-y-3">
        {lines.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 rounded-2xl border bg-card p-3"
          >
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
              {item.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageSrc}
                  alt={item.title}
                  className="size-full object-cover"
                />
              ) : (
                <Package className="size-8 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-heading font-semibold">{item.title}</p>
              <p className="flex items-center gap-1 text-sm text-[var(--star-gold-foreground)]">
                <Star className="size-3.5 fill-star-gold text-star-gold" />
                <span className="tabular-nums font-bold">{item.unitCost}</span>
                <span className="text-muted-foreground">
                  · {t("lineTotal")}{" "}
                  <span className="tabular-nums font-semibold text-foreground">
                    {item.lineCost}
                  </span>
                </span>
              </p>
              {editable ? (
                <div className="flex items-center gap-2">
                  <CartQtyButton
                    label="−"
                    disabled={saving || item.qty <= 0}
                    onClick={() => updateQty(item.id, item.qty - 1)}
                  />
                  <span className="min-w-8 text-center tabular-nums font-semibold">
                    {item.qty}
                  </span>
                  <CartQtyButton
                    label="+"
                    disabled={saving || item.qty >= item.stock}
                    onClick={() => updateQty(item.id, item.qty + 1)}
                  />
                  <span className="sr-only">{t("qty")}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("qty")}:{" "}
                  <span className="tabular-nums font-semibold text-foreground">
                    {item.qty}
                  </span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-3 rounded-2xl bg-[var(--star-gold-muted)] p-4">
        <div className="flex justify-between text-sm">
          <span>{t("balance")}</span>
          <span className="tabular-nums font-semibold">
            {spendableBalance} {currencyLabel}
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold text-[var(--star-gold-foreground)]">
          <span>{t("total")}</span>
          <span className="tabular-nums">
            {total} {currencyLabel}
          </span>
        </div>
        {!affordable && total > 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("starsRemaining", { count: remaining })}
          </p>
        ) : null}
      </div>

      {editable ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={!dirty || saving}>
            {saving ? tCommon("loading") : tCommon("save")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
