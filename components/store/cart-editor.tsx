"use client";

import { Currency, Package } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  saveCartDraft,
  type CartActionState,
} from "@/app/[documentId]/store/actions";
import { CartQtyButton } from "@/components/store/cart-form-buttons";
import { Button } from "@/components/ui/button";
import { showErrorToast } from "@/lib/ui/app-toast";
import {
  isCartDraftDirty,
  maxQtyForCurrency,
  remainingCurrencyBalance,
  serializeCartDraftPayload,
  setAwardCurrencyQty,
  type CartDraftAward,
  type StoreCurrencyBalance,
} from "@/lib/store/cart-draft";
import { cn } from "@/lib/utils";

const INITIAL: CartActionState = { ok: false };

export type CartEditorProps = {
  initialAwards: CartDraftAward[];
  currencies: StoreCurrencyBalance[];
  editable?: boolean;
};

export function CartEditor({
  initialAwards,
  currencies,
  editable = true,
}: CartEditorProps) {
  const t = useTranslations("cart");
  const tCommon = useTranslations("common");
  const [baseline, setBaseline] = useState(initialAwards);
  const [draft, setDraft] = useState(initialAwards);
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialAwards.map((award) => [
        award.awardId,
        award.prices[0]?.currencyId ?? "",
      ]),
    ),
  );
  const [state, saveAction, saving] = useActionState(saveCartDraft, INITIAL);

  useEffect(() => {
    setBaseline(initialAwards);
    setDraft(initialAwards);
    setSelected(
      Object.fromEntries(
        initialAwards.map((award) => [
          award.awardId,
          award.prices[0]?.currencyId ?? "",
        ]),
      ),
    );
  }, [initialAwards]);

  useEffect(() => {
    if (!state.ok && state.messageKey) {
      showErrorToast(t(state.messageKey));
    }
  }, [state, t]);

  const dirty = isCartDraftDirty(baseline, draft);
  const balancesById = useMemo(
    () => new Map(currencies.map((currency) => [currency.currencyId, currency])),
    [currencies],
  );

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
        {draft.map((award) => {
          const selectedId =
            selected[award.awardId] ?? award.prices[0]?.currencyId ?? "";
          const selectedPrice = award.prices.find(
            (price) => price.currencyId === selectedId,
          );
          const balance = balancesById.get(selectedId)?.balance ?? 0;

          return (
            <li
              key={award.awardId}
              className="grid grid-cols-[5rem_minmax(0,1fr)_auto] gap-3 rounded-2xl border bg-card p-3"
            >
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                {award.imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={award.imageSrc}
                    alt={award.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <Package className="size-8 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 space-y-2">
                <p className="font-heading font-semibold">{award.title}</p>
                <fieldset className="space-y-1">
                  <legend className="sr-only">{t("qty")}</legend>
                  {award.prices.map((price) => (
                    <label
                      key={price.currencyId}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5",
                        price.qty > 0 && "bg-muted/60",
                      )}
                    >
                      <input
                        type="radio"
                        name={`currency-${award.awardId}`}
                        value={price.currencyId}
                        checked={selectedId === price.currencyId}
                        disabled={!editable || saving}
                        onChange={() =>
                          setSelected((current) => ({
                            ...current,
                            [award.awardId]: price.currencyId,
                          }))
                        }
                      />
                      {price.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={price.iconUrl}
                          alt=""
                          className="size-4 object-contain"
                        />
                      ) : (
                        <Currency
                          className="size-4 text-muted-foreground"
                          aria-hidden
                        />
                      )}
                      <span className="tabular-nums font-bold text-[var(--star-gold-foreground)]">
                        {price.unitCost}
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>

              <div className="flex items-center self-center">
                {editable && selectedPrice ? (
                  <div className="flex items-center gap-2">
                    <CartQtyButton
                      label="−"
                      disabled={saving || selectedPrice.qty <= 0}
                      onClick={() =>
                        setDraft((current) =>
                          setAwardCurrencyQty(
                            current,
                            award.awardId,
                            selectedId,
                            selectedPrice.qty - 1,
                            balance,
                          ),
                        )
                      }
                    />
                    <span className="min-w-8 text-center tabular-nums font-semibold">
                      {selectedPrice.qty}
                    </span>
                    <CartQtyButton
                      label="+"
                      disabled={
                        saving ||
                        selectedPrice.qty >=
                          maxQtyForCurrency(
                            draft,
                            award.awardId,
                            selectedId,
                            balance,
                          )
                      }
                      onClick={() =>
                        setDraft((current) =>
                          setAwardCurrencyQty(
                            current,
                            award.awardId,
                            selectedId,
                            selectedPrice.qty + 1,
                            balance,
                          ),
                        )
                      }
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("qty")}:{" "}
                    <span className="tabular-nums font-semibold text-foreground">
                      {selectedPrice?.qty ?? 0}
                    </span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-3">
        {currencies.map((currency) => {
          const after = remainingCurrencyBalance(
            draft,
            currency.currencyId,
            currency.balance,
          );
          const total = currency.balance - after;
          return (
            <div
              key={currency.currencyId}
              className="space-y-3 rounded-2xl bg-[var(--star-gold-muted)] p-4"
            >
              <div className="flex items-center justify-between text-sm">
                <span>{t("balance")}</span>
                <span className="flex items-center gap-2 tabular-nums font-semibold">
                  {currency.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currency.iconUrl}
                      alt=""
                      className="size-4 object-contain"
                    />
                  ) : (
                    <Currency className="size-4" aria-hidden />
                  )}
                  {currency.balance} {currency.label}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-[var(--star-gold-foreground)]">
                <span>{t("total")}</span>
                <span className="tabular-nums">
                  {total} {currency.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("balanceAfterExchanges")}</span>
                <span className="tabular-nums font-semibold">
                  {after} {currency.label}
                </span>
              </div>
            </div>
          );
        })}
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
