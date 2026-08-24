"use client";

import { Package } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  saveCartDraft,
  type CartActionState,
} from "@/app/[documentId]/store/actions";
import { CartQtyButton } from "@/components/store/cart-form-buttons";
import { Button } from "@/components/ui/button";
import { formatExchangeCurrencyLabel } from "@/lib/format/exchange-currency";
import {
  isCartDraftDirty,
  maxQtyForCurrency,
  remainingCurrencyBalance,
  serializeCartDraftPayload,
  setAwardCurrencyQty,
  type CartDraftAward,
  type CartDraftPrice,
  type StoreCurrencyBalance,
} from "@/lib/store/cart-draft";
import {
  STORE_AWARD_CARD_CLASS,
  STORE_AWARD_IMAGE_FRAME_CLASS,
  STORE_BALANCE_BG_IMAGE_CLASS,
  STORE_BALANCE_CARD_CLASS,
  STORE_BALANCE_LABEL_CLASS,
  STORE_BALANCE_VALUE_CLASS,
  STORE_ROW_SCROLL_CLASS,
} from "@/lib/store/store-layout";
import { showErrorToast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

const INITIAL: CartActionState = { ok: false };

function defaultSelectedCurrencies(
  awards: CartDraftAward[],
): Record<string, string> {
  return Object.fromEntries(
    awards.map((award) => [award.awardId, award.prices[0]?.currencyId ?? ""]),
  );
}

function currencyLabels(
  currency: StoreCurrencyBalance | undefined,
  fallback: string,
) {
  return {
    title: currency?.title ?? fallback,
    pluralTitle: currency?.pluralTitle ?? fallback,
  };
}

function StoreAwardCard({
  award,
  selectedId,
  selectedPrice,
  balance,
  editable,
  saving,
  draft,
  balancesById,
  onSelect,
  onQtyChange,
}: {
  award: CartDraftAward;
  selectedId: string;
  selectedPrice: CartDraftPrice | undefined;
  balance: number;
  editable: boolean;
  saving: boolean;
  draft: CartDraftAward[];
  balancesById: Map<string, StoreCurrencyBalance>;
  onSelect: (currencyId: string) => void;
  onQtyChange: (qty: number) => void;
}) {
  const t = useTranslations("cart");

  return (
    <li className={STORE_AWARD_CARD_CLASS}>
      <div className={STORE_AWARD_IMAGE_FRAME_CLASS}>
        {award.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={award.imageSrc}
            alt={award.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-10 text-muted-foreground" aria-hidden />
          </div>
        )}
      </div>

      <div className="space-y-3 p-3">
        <p className="font-heading font-semibold">{award.title}</p>

        <fieldset className="space-y-1">
          <legend className="sr-only">{t("currencyChoice")}</legend>
          {award.prices.map((price) => {
            const labels = currencyLabels(
              balancesById.get(price.currencyId),
              price.label,
            );
            return (
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
                  onChange={() => onSelect(price.currencyId)}
                />
                <span className="tabular-nums font-bold text-[var(--star-gold-foreground)]">
                  {formatExchangeCurrencyLabel(price.unitCost, labels)}
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="flex items-center justify-center rounded-xl bg-muted/50 py-2">
          {editable && selectedPrice ? (
            <div className="flex items-center gap-2">
              <CartQtyButton
                label="−"
                disabled={saving || selectedPrice.qty <= 0}
                onClick={() => onQtyChange(selectedPrice.qty - 1)}
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
                onClick={() => onQtyChange(selectedPrice.qty + 1)}
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
      </div>
    </li>
  );
}

function StoreBalanceCard({
  currency,
  draft,
}: {
  currency: StoreCurrencyBalance;
  draft: CartDraftAward[];
}) {
  const t = useTranslations("cart");
  const after = remainingCurrencyBalance(
    draft,
    currency.currencyId,
    currency.balance,
  );
  const total = currency.balance - after;
  const labels = {
    title: currency.title,
    pluralTitle: currency.pluralTitle,
  };

  return (
    <li className={STORE_BALANCE_CARD_CLASS}>
      {currency.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currency.iconUrl}
          alt=""
          className={STORE_BALANCE_BG_IMAGE_CLASS}
        />
      ) : null}
      <div className="relative z-10 space-y-3">
        <div className="space-y-0.5">
          <p className={STORE_BALANCE_LABEL_CLASS}>{t("balanceToday")}</p>
          <p className={STORE_BALANCE_VALUE_CLASS}>
            {formatExchangeCurrencyLabel(currency.balance, labels)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className={STORE_BALANCE_LABEL_CLASS}>{t("redemptionTotal")}</p>
          <p
            className={cn(
              STORE_BALANCE_VALUE_CLASS,
              "text-[var(--star-gold-foreground)]",
            )}
          >
            {formatExchangeCurrencyLabel(total, labels)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className={STORE_BALANCE_LABEL_CLASS}>{t("remainingBalance")}</p>
          <p className={STORE_BALANCE_VALUE_CLASS}>
            {formatExchangeCurrencyLabel(after, labels)}
          </p>
        </div>
      </div>
    </li>
  );
}

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
    defaultSelectedCurrencies(initialAwards),
  );
  const sourceKey = serializeCartDraftPayload(initialAwards);
  const [sourceSnapshot, setSourceSnapshot] = useState(sourceKey);
  if (sourceSnapshot !== sourceKey) {
    setSourceSnapshot(sourceKey);
    setBaseline(initialAwards);
    setDraft(initialAwards);
    setSelected(defaultSelectedCurrencies(initialAwards));
  }
  const [state, saveAction, saving] = useActionState(saveCartDraft, INITIAL);

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

  return (
    <form action={saveAction} className="space-y-6">
      <input
        type="hidden"
        name="payload"
        value={serializeCartDraftPayload(draft)}
        readOnly
      />

      {draft.length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul
          className={STORE_ROW_SCROLL_CLASS}
          aria-label={t("awardsRow")}
          data-testid="store-awards-row"
        >
          {draft.map((award) => {
            const selectedId =
              selected[award.awardId] ?? award.prices[0]?.currencyId ?? "";
            const selectedPrice = award.prices.find(
              (price) => price.currencyId === selectedId,
            );
            const balance = balancesById.get(selectedId)?.balance ?? 0;
            return (
              <StoreAwardCard
                key={award.awardId}
                award={award}
                selectedId={selectedId}
                selectedPrice={selectedPrice}
                balance={balance}
                editable={editable}
                saving={saving}
                draft={draft}
                balancesById={balancesById}
                onSelect={(currencyId) =>
                  setSelected((current) => ({
                    ...current,
                    [award.awardId]: currencyId,
                  }))
                }
                onQtyChange={(qty) =>
                  setDraft((current) =>
                    setAwardCurrencyQty(
                      current,
                      award.awardId,
                      selectedId,
                      qty,
                      balance,
                    ),
                  )
                }
              />
            );
          })}
        </ul>
      )}

      {currencies.length > 0 ? (
        <ul
          className={STORE_ROW_SCROLL_CLASS}
          aria-label={t("balancesRow")}
          data-testid="store-balances-row"
        >
          {currencies.map((currency) => (
            <StoreBalanceCard
              key={currency.currencyId}
              currency={currency}
              draft={draft}
            />
          ))}
        </ul>
      ) : null}

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
