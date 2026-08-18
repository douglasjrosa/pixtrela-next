"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

import { KioskActionButton } from "./kiosk-action-button";
import { KioskQtyStepper } from "./kiosk-qty-stepper";

export interface KioskExitSubtaskFormProps {
  sharingType: SubTaskFormInput["sharingType"];
  maxQty?: number;
  /** When false, duration completion and qty-based finish are blocked by peers. */
  allowComplete?: boolean;
  disabled?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (input: KioskExitInput) => void;
}

export function KioskExitSubtaskForm({
  sharingType,
  maxQty = 1,
  allowComplete = true,
  disabled = false,
  busy = false,
  onCancel,
  onConfirm,
}: KioskExitSubtaskFormProps) {
  const t = useTranslations("kiosk");
  const safeMaxQty = Math.max(0, maxQty);
  const [qtyCompleted, setQtyCompleted] = useState(safeMaxQty);
  const [qtyError, setQtyError] = useState<string | null>(null);
  const actionsDisabled = disabled || busy;
  const confirmLabel = busy ? t("actionLoading") : t("exitConfirm");

  if (sharingType === "duration") {
    if (!allowComplete) {
      return (
        <div className="space-y-3 rounded-2xl border bg-muted p-3">
          <p className="text-base font-medium">{t("exitWithoutCompleteHint")}</p>
          <div className="flex flex-col gap-2">
            <KioskActionButton
              actionVariant="produce"
              disabled={actionsDisabled}
              onClick={() =>
                onConfirm({ sharingType: "duration", isCompleted: false })
              }
            >
              {confirmLabel}
            </KioskActionButton>
            <KioskActionButton
              actionVariant="outline"
              disabled={actionsDisabled}
              onClick={onCancel}
            >
              {t("exitCancel")}
            </KioskActionButton>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 rounded-2xl border bg-muted p-3">
        <p className="text-base font-medium">{t("exitConfirmDuration")}</p>
        <div className="flex flex-col gap-2">
          <KioskActionButton
            actionVariant="produce"
            disabled={actionsDisabled}
            onClick={() =>
              onConfirm({ sharingType: "duration", isCompleted: true })
            }
          >
            {busy ? t("actionLoading") : t("exitCompletedYes")}
          </KioskActionButton>
          <KioskActionButton
            actionVariant="outline"
            disabled={actionsDisabled}
            onClick={() =>
              onConfirm({ sharingType: "duration", isCompleted: false })
            }
          >
            {t("exitCompletedNo")}
          </KioskActionButton>
          <KioskActionButton
            actionVariant="outline"
            disabled={actionsDisabled}
            onClick={onCancel}
          >
            {t("exitCancel")}
          </KioskActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-muted p-3">
      {!allowComplete ? (
        <p className="text-base text-muted-foreground">
          {t("exitQtyWithoutCompleteHint")}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="kiosk-exit-qty" className="text-base">
          {t("exitQtyLabel")}
        </Label>
        <KioskQtyStepper
          id="kiosk-exit-qty"
          value={qtyCompleted}
          max={safeMaxQty}
          disabled={actionsDisabled}
          onChange={(next) => {
            setQtyCompleted(next);
            setQtyError(null);
          }}
        />
        <p className="text-sm text-muted-foreground">
          {t("exitQtyMax", { max: safeMaxQty })}
        </p>
        {qtyError ? (
          <p className="text-sm text-destructive" role="alert">
            {qtyError}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <KioskActionButton
          actionVariant="produce"
          disabled={actionsDisabled}
          onClick={() => {
            if (!Number.isInteger(qtyCompleted) || qtyCompleted < 0) {
              setQtyError(t("exitQtyInvalid"));
              return;
            }
            if (qtyCompleted > safeMaxQty) {
              setQtyError(t("exitQtyExceeds"));
              return;
            }
            onConfirm({ sharingType: "qty", qtyCompleted });
          }}
        >
          {confirmLabel}
        </KioskActionButton>
        <KioskActionButton
          actionVariant="outline"
          disabled={actionsDisabled}
          onClick={onCancel}
        >
          {t("exitCancel")}
        </KioskActionButton>
      </div>
    </div>
  );
}
