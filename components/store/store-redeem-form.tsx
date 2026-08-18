"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  redeemAward,
  type RedeemAwardState,
} from "@/app/(app)/exchange/actions";
import { StoreRedeemSubmitButton } from "@/components/store/store-redeem-submit-button";

const INITIAL_STATE: RedeemAwardState = { ok: false };

export interface StoreRedeemFormProps {
  awardId: string;
  awardTitle: string;
  currencyId: string;
  windowOpen: boolean;
  affordable: boolean;
  inStock: boolean;
}

export function StoreRedeemForm({
  awardId,
  awardTitle,
  currencyId,
  windowOpen,
  affordable,
  inStock,
}: StoreRedeemFormProps) {
  const t = useTranslations("exchange");
  const [state, formAction] = useActionState(redeemAward, INITIAL_STATE);

  let statusMessage: string | null = null;
  if (state.messageKey === "success" && state.awardTitle) {
    statusMessage = t("redeemCelebration", { award: state.awardTitle });
  } else if (state.messageKey === "insufficient") {
    statusMessage = t("insufficient");
  } else if (state.messageKey === "outOfStock") {
    statusMessage = t("outOfStock");
  } else if (state.messageKey === "windowClosed") {
    statusMessage = t("windowClosedShort");
  } else if (state.messageKey === "redeemFailed") {
    statusMessage = t("redeemFailed");
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="awardId" value={awardId} />
      <input type="hidden" name="currencyId" value={currencyId} />
      <input type="hidden" name="qty" value="1" />
      <input type="hidden" name="awardTitle" value={awardTitle} />
      <StoreRedeemSubmitButton
        windowOpen={windowOpen}
        affordable={affordable}
        inStock={inStock}
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
