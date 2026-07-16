"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

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
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <p className="text-sm font-medium">{t("exitWithoutCompleteHint")}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={disabled}
              onClick={() =>
                onConfirm({ sharingType: "duration", isCompleted: false })
              }
            >
              {t("exitConfirm")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={onCancel}
            >
              {t("exitCancel")}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
        <p className="text-sm font-medium">{t("exitConfirmDuration")}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={disabled}
            onClick={() =>
              onConfirm({ sharingType: "duration", isCompleted: true })
            }
          >
            {t("exitCompletedYes")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() =>
              onConfirm({ sharingType: "duration", isCompleted: false })
            }
          >
            {t("exitCompletedNo")}
          </Button>
          <Button type="button" variant="ghost" disabled={disabled} onClick={onCancel}>
            {t("exitCancel")}
          </Button>
        </div>
      </div>
    );
  }

  const safeMaxQty = Math.max(1, maxQty);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      {!allowComplete ? (
        <p className="text-sm text-muted-foreground">
          {t("exitQtyWithoutCompleteHint")}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="kiosk-exit-qty">{t("exitQtyLabel")}</Label>
        <Input
          id="kiosk-exit-qty"
          type="number"
          min={1}
          max={safeMaxQty}
          value={qtyCompleted}
          disabled={disabled}
          onChange={(event) => {
            setQtyCompleted(event.target.value);
            setQtyError(null);
          }}
        />
        <p className="text-xs text-muted-foreground">
          {t("exitQtyMax", { max: safeMaxQty })}
        </p>
        {qtyError ? (
          <p className="text-sm text-destructive" role="alert">
            {qtyError}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
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
        </Button>
        <Button type="button" variant="ghost" disabled={disabled} onClick={onCancel}>
          {t("exitCancel")}
        </Button>
      </div>
    </div>
  );
}
