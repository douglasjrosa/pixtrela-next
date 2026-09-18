"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";
import type { MaterialFlagOption } from "@/lib/business/subtask-queue";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import { cn } from "@/lib/utils";

import { KioskActionButton } from "./kiosk-action-button";
import { KioskMaterialFlagPicker } from "./kiosk-material-flag-picker";
import { KioskWizardCheckpointBar } from "./kiosk-wizard-checkpoint-bar";

export interface KioskChainMemberFieldsProps {
  documentId: string;
  name: string;
  variant?: "inline" | "modal";
  showName?: boolean;
  sharingType: SubTaskFormInput["sharingType"];
  minQty?: number;
  maxQty?: number;
  defaultQty?: number;
  availableFlags?: MaterialFlagOption[];
  subTaskCategoryId?: string | null;
  requiresMaterialFlagsOnFinish?: boolean;
  value?: ChainStopAnswer;
  disabled?: boolean;
  wizardStepCount?: number;
  wizardStepIndex?: number;
  onChange: (answer: ChainStopAnswer) => void;
  onRefreshFlags?: () => Promise<{
    flags: MaterialFlagOption[];
    categoryId: string | null;
  }>;
}

const INLINE_SHELL_CLASS = "space-y-2 rounded-2xl border bg-muted p-3";
const MODAL_SHELL_CLASS = "flex min-h-0 flex-1 flex-col gap-4";

export function KioskChainMemberFields({
  documentId,
  name,
  variant = "inline",
  showName = true,
  sharingType,
  minQty = 0,
  maxQty = 1,
  defaultQty,
  availableFlags: initialFlags = [],
  subTaskCategoryId = null,
  requiresMaterialFlagsOnFinish = false,
  value,
  disabled = false,
  wizardStepCount,
  wizardStepIndex,
  onChange,
  onRefreshFlags,
}: KioskChainMemberFieldsProps) {
  const t = useTranslations("kiosk");
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const safeMaxQty = Math.max(0, maxQty);
  const safeMinQty = Math.min(safeMaxQty, Math.max(0, minQty));
  const showWizardProgress =
    variant === "modal" &&
    wizardStepCount != null &&
    wizardStepIndex != null &&
    wizardStepCount > 1;
  const [refreshByMemberId, setRefreshByMemberId] = useState<
    Record<
      string,
      {
        flags: MaterialFlagOption[];
        categoryId: string | null;
        allowSemBandeiraOption: boolean;
      }
    >
  >({});
  const [refreshPending, startRefresh] = useTransition();

  const refreshOverride = refreshByMemberId[documentId] ?? null;
  const availableFlags = refreshOverride?.flags ?? initialFlags;
  const categoryId = refreshOverride?.categoryId ?? subTaskCategoryId;
  const allowSemBandeiraOption =
    refreshOverride?.allowSemBandeiraOption ??
    (initialFlags.length === 0 && Boolean(subTaskCategoryId));

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
      const nextAllowSemBandeira =
        result.flags.length === 0 && Boolean(result.categoryId);
      setRefreshByMemberId((current) => ({
        ...current,
        [documentId]: {
          flags: result.flags,
          categoryId: result.categoryId,
          allowSemBandeiraOption: nextAllowSemBandeira,
        },
      }));
      patch({
        availableFlagCount: result.flags.length,
        semBandeira: false,
      });
    });
  }

  const shellClassName =
    variant === "modal" ? MODAL_SHELL_CLASS : INLINE_SHELL_CLASS;
  const modalQuestionClassName = "mt-5 text-xl font-medium";

  useEffect(() => {
    if (variant !== "modal" || sharingType !== "qty" || disabled) return;
    qtyInputRef.current?.focus();
  }, [documentId, disabled, sharingType, variant]);

  return (
    <div className={shellClassName}>
      {showName ? <p className="text-base font-medium">{name}</p> : null}
      {sharingType === "duration" ? (
        <div className="flex flex-col gap-2">
          <p
            className={variant === "modal" ? modalQuestionClassName : "text-base"}
          >
            {t("exitConfirmDuration")}
          </p>
          {showWizardProgress ? (
            <KioskWizardCheckpointBar
              stepCount={wizardStepCount}
              currentStepIndex={wizardStepIndex}
            />
          ) : null}
          {variant === "modal" ? (
            <div className="flex w-full flex-row gap-3">
              <KioskActionButton
                actionVariant="outline"
                className={cn(
                  "min-w-0 flex-1",
                  value?.completed === false && "bg-muted",
                )}
                disabled={disabled}
                aria-pressed={value?.completed === false}
                onClick={() => patch({ completed: false })}
              >
                {t("exitCompletedNoShort")}
              </KioskActionButton>
              <KioskActionButton
                actionVariant={
                  value?.completed === true
                    ? "successOutlineActive"
                    : "successOutline"
                }
                className="min-w-0 flex-1"
                disabled={disabled}
                aria-pressed={value?.completed === true}
                onClick={() => patch({ completed: true })}
              >
                {t("exitCompletedYesShort")}
              </KioskActionButton>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      ) : (
        <div
          className={variant === "modal" ? "flex flex-col gap-2" : "space-y-2"}
        >
          <Label
            htmlFor={`kiosk-chain-qty-${documentId}`}
            className={variant === "modal" ? modalQuestionClassName : "text-base"}
          >
            {t("exitQtyLabel")}
          </Label>
          {showWizardProgress ? (
            <KioskWizardCheckpointBar
              stepCount={wizardStepCount}
              currentStepIndex={wizardStepIndex}
            />
          ) : null}
          <Input
            ref={qtyInputRef}
            id={`kiosk-chain-qty-${documentId}`}
            type="number"
            inputMode="numeric"
            min={safeMinQty}
            max={safeMaxQty}
            value={
              value?.qty !== undefined
                ? String(value.qty)
                : defaultQty !== undefined
                  ? String(defaultQty)
                  : ""
            }
            disabled={disabled}
            className="h-14 rounded-2xl text-center text-lg"
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
      {value?.inferred === true ? null : (
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
          scrollableFlags={variant === "modal"}
          onSemBandeiraChange={(selected) =>
            patch({
              semBandeira: selected,
              flagIds: selected ? [] : value?.flagIds,
            })
          }
          onRefresh={onRefreshFlags ? handleRefresh : undefined}
          refreshing={refreshPending}
          onChange={(flagIds) => patch({ flagIds, semBandeira: false })}
        />
      )}
    </div>
  );
}
