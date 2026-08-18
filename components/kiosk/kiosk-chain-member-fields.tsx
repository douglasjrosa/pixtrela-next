"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";
import type { MaterialFlagOption } from "@/lib/business/subtask-queue";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import { cn } from "@/lib/utils";

import { KioskActionButton } from "./kiosk-action-button";
import { KioskMaterialFlagPicker } from "./kiosk-material-flag-picker";

export interface KioskChainMemberFieldsProps {
  documentId: string;
  name: string;
  sharingType: SubTaskFormInput["sharingType"];
  maxQty?: number;
  availableFlags?: MaterialFlagOption[];
  value?: ChainStopAnswer;
  disabled?: boolean;
  onChange: (answer: ChainStopAnswer) => void;
}

export function KioskChainMemberFields({
  documentId,
  name,
  sharingType,
  maxQty = 1,
  availableFlags = [],
  value,
  disabled = false,
  onChange,
}: KioskChainMemberFieldsProps) {
  const t = useTranslations("kiosk");
  const safeMaxQty = Math.max(0, maxQty);

  return (
    <div className="space-y-2 rounded-2xl border bg-muted p-3">
      <p className="text-base font-medium">{name}</p>
      {sharingType === "duration" ? (
        <div className="flex flex-col gap-2">
          <p className="text-base">{t("exitConfirmDuration")}</p>
          <KioskActionButton
            actionVariant={value?.completed === true ? "produce" : "outline"}
            disabled={disabled}
            aria-pressed={value?.completed === true}
            onClick={() =>
              onChange({
                documentId,
                completed: true,
                flagIds: value?.flagIds,
              })
            }
          >
            {t("exitCompletedYes")}
          </KioskActionButton>
          <KioskActionButton
            actionVariant={value?.completed === false ? "produce" : "outline"}
            disabled={disabled}
            aria-pressed={value?.completed === false}
            onClick={() =>
              onChange({
                documentId,
                completed: false,
                flagIds: value?.flagIds,
              })
            }
          >
            {t("exitCompletedNo")}
          </KioskActionButton>
        </div>
      ) : (
        <div className="space-y-2">
          <Label
            htmlFor={`kiosk-chain-qty-${documentId}`}
            className="text-base"
          >
            {t("exitQtyLabel")}
          </Label>
          <Input
            id={`kiosk-chain-qty-${documentId}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={safeMaxQty}
            value={value?.qty !== undefined ? String(value.qty) : ""}
            disabled={disabled}
            className={cn("h-14 rounded-2xl text-lg")}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              onChange({
                documentId,
                qty: Number.isInteger(parsed) ? parsed : undefined,
                flagIds: value?.flagIds,
              });
            }}
          />
          <p className="text-sm text-muted-foreground">
            {t("exitQtyMax", { max: safeMaxQty })}
          </p>
        </div>
      )}
      <KioskMaterialFlagPicker
        flags={availableFlags}
        selectedIds={value?.flagIds ?? []}
        disabled={disabled}
        onChange={(flagIds) =>
          onChange({
            documentId,
            completed: value?.completed,
            qty: value?.qty,
            flagIds,
          })
        }
      />
    </div>
  );
}
