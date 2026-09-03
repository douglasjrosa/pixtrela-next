"use client";

import { useState, useTransition } from "react";
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
  subTaskCategoryId?: string | null;
  requiresMaterialFlagsOnFinish?: boolean;
  value?: ChainStopAnswer;
  disabled?: boolean;
  onChange: (answer: ChainStopAnswer) => void;
  onRefreshFlags?: () => Promise<{
    flags: MaterialFlagOption[];
    categoryId: string | null;
  }>;
}

export function KioskChainMemberFields({
  documentId,
  name,
  sharingType,
  maxQty = 1,
  availableFlags: initialFlags = [],
  subTaskCategoryId = null,
  requiresMaterialFlagsOnFinish = false,
  value,
  disabled = false,
  onChange,
  onRefreshFlags,
}: KioskChainMemberFieldsProps) {
  const t = useTranslations("kiosk");
  const safeMaxQty = Math.max(0, maxQty);
  const [availableFlags, setAvailableFlags] =
    useState<MaterialFlagOption[]>(initialFlags);
  const [categoryId, setCategoryId] = useState<string | null>(
    subTaskCategoryId,
  );
  const [allowSemBandeiraOption, setAllowSemBandeiraOption] = useState(false);
  const [refreshPending, startRefresh] = useTransition();

  function patch(next: Partial<ChainStopAnswer>): void {
    onChange({
      documentId,
      completed: value?.completed,
      qty: value?.qty,
      flagIds: value?.flagIds,
      semBandeira: value?.semBandeira,
      availableFlagCount:
        value?.availableFlagCount ?? availableFlags.length,
      ...next,
    });
  }

  function handleRefresh(): void {
    if (!onRefreshFlags) return;
    startRefresh(async () => {
      const result = await onRefreshFlags();
      setAvailableFlags(result.flags);
      setCategoryId(result.categoryId);
      if (result.flags.length === 0) {
        setAllowSemBandeiraOption(Boolean(result.categoryId));
        patch({
          availableFlagCount: 0,
          semBandeira: false,
        });
      } else {
        setAllowSemBandeiraOption(false);
        patch({
          availableFlagCount: result.flags.length,
          semBandeira: false,
        });
      }
    });
  }

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
            onClick={() => patch({ completed: true })}
          >
            {t("exitCompletedYes")}
          </KioskActionButton>
          <KioskActionButton
            actionVariant={value?.completed === false ? "produce" : "outline"}
            disabled={disabled}
            aria-pressed={value?.completed === false}
            onClick={() => patch({ completed: false })}
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
              patch({
                qty: Number.isInteger(parsed) ? parsed : undefined,
              });
            }}
          />
          <p className="text-sm text-muted-foreground">
            {safeMaxQty === 0
              ? t("exitQtyNoneRemainingHint")
              : t("exitQtyMax", { max: safeMaxQty })}
          </p>
        </div>
      )}
      <KioskMaterialFlagPicker
        flags={availableFlags}
        selectedIds={value?.flagIds ?? []}
        disabled={disabled}
        categoryId={categoryId}
        requiresMaterialFlagsOnFinish={requiresMaterialFlagsOnFinish}
        allowSemBandeiraOption={allowSemBandeiraOption}
        semBandeiraSelected={
          value?.semBandeira === true ||
          (requiresMaterialFlagsOnFinish && !categoryId)
        }
        onSemBandeiraChange={(selected) =>
          patch({ semBandeira: selected, flagIds: selected ? [] : value?.flagIds })
        }
        onRefresh={onRefreshFlags ? handleRefresh : undefined}
        refreshing={refreshPending}
        onChange={(flagIds) => patch({ flagIds, semBandeira: false })}
      />
    </div>
  );
}
