"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

import { KioskActionButton } from "./kiosk-action-button";

export interface KioskExitSubtaskFormProps {
  sharingType: SubTaskFormInput["sharingType"];
  maxQty?: number;
  /** When false, duration completion and qty-based finish are blocked by peers. */
  allowComplete?: boolean;
  disabled?: boolean;
  onCancel: () => void;
  onConfirm: (input: KioskExitInput) => void;
}

export function KioskExitSubtaskForm({
  sharingType,
  maxQty = 1,
  allowComplete = true,
  disabled = false,
  onCancel,
  onConfirm,
}: KioskExitSubtaskFormProps) {
  const t = useTranslations("kiosk");
  const [qtyCompleted, setQtyCompleted] = useState("1");
  const [qtyError, setQtyError] = useState<string | null>(null);

  if (sharingType === "duration") {
    if (!allowComplete) {
      return (
        <div className="space-y-3 rounded-2xl border bg-muted p-3">
          <p className="text-base font-medium">{t("exitWithoutCompleteHint")}</p>
          <div className="flex flex-col gap-2">
            <KioskActionButton
              actionVariant="produce"
              disabled={disabled}
              onClick={() =>
                onConfirm({ sharingType: "duration", isCompleted: false })
              }
            >
              {t("exitConfirm")}
            </KioskActionButton>
            <KioskActionButton
              actionVariant="outline"
              disabled={disabled}
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
            disabled={disabled}
            onClick={() =>
              onConfirm({ sharingType: "duration", isCompleted: true })
            }
          >
            {t("exitCompletedYes")}
          </KioskActionButton>
          <KioskActionButton
            actionVariant="outline"
            disabled={disabled}
            onClick={() =>
              onConfirm({ sharingType: "duration", isCompleted: false })
            }
          >
            {t("exitCompletedNo")}
          </KioskActionButton>
          <KioskActionButton
            actionVariant="outline"
            disabled={disabled}
            onClick={onCancel}
          >
            {t("exitCancel")}
          </KioskActionButton>
        </div>
      </div>
    );
  }

  const safeMaxQty = Math.max(1, maxQty);

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
        <Input
          id="kiosk-exit-qty"
          type="number"
          inputMode="numeric"
          min={1}
          max={safeMaxQty}
          value={qtyCompleted}
          disabled={disabled}
          className="h-14 rounded-2xl text-lg"
          onChange={(event) => {
            setQtyCompleted(event.target.value);
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
          disabled={disabled}
          onClick={() => {
            const parsed = Number.parseInt(qtyCompleted, 10);
            if (!Number.isInteger(parsed) || parsed < 1) {
              setQtyError(t("exitQtyInvalid"));
              return;
            }
            if (parsed > safeMaxQty) {
              setQtyError(t("exitQtyExceeds"));
              return;
            }
            onConfirm({ sharingType: "qty", qtyCompleted: parsed });
          }}
        >
          {t("exitConfirm")}
        </KioskActionButton>
        <KioskActionButton
          actionVariant="outline"
          disabled={disabled}
          onClick={onCancel}
        >
          {t("exitCancel")}
        </KioskActionButton>
      </div>
    </div>
  );
}
