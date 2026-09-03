"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import { canConfirmFinishWithFlags } from "@/lib/business/subtask-material-flags";
import type { MaterialFlagOption } from "@/lib/business/subtask-queue";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import { resolveInitialMaterialFlagIds } from "@/lib/business/subtask-chain-allocation";

import { KioskActionButton } from "./kiosk-action-button";
import { KioskMaterialFlagPicker } from "./kiosk-material-flag-picker";
import { KioskQtyStepper } from "./kiosk-qty-stepper";

export interface KioskExitSubtaskFormProps {
  sharingType: SubTaskFormInput["sharingType"];
  maxQty?: number;
  /** When false, duration completion and qty-based finish are blocked by peers. */
  allowComplete?: boolean;
  disabled?: boolean;
  busy?: boolean;
  availableFlags?: MaterialFlagOption[];
  assignedFlagCodes?: string[];
  subTaskCategoryId?: string | null;
  requiresMaterialFlagsOnFinish?: boolean;
  onRefreshFlags?: () => Promise<{
    flags: MaterialFlagOption[];
    categoryId: string | null;
    requiresMaterialFlagsOnFinish?: boolean;
  }>;
  onCancel: () => void;
  onConfirm: (input: KioskExitInput) => void;
}

export function KioskExitSubtaskForm({
  sharingType,
  maxQty = 1,
  allowComplete = true,
  disabled = false,
  busy = false,
  availableFlags: initialFlags = [],
  assignedFlagCodes = [],
  subTaskCategoryId = null,
  requiresMaterialFlagsOnFinish: initialRequiresFlags = false,
  onRefreshFlags,
  onCancel,
  onConfirm,
}: KioskExitSubtaskFormProps) {
  const t = useTranslations("kiosk");
  const safeMaxQty = Math.max(0, maxQty);
  const [qtyCompleted, setQtyCompleted] = useState(safeMaxQty);
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [availableFlags, setAvailableFlags] =
    useState<MaterialFlagOption[]>(initialFlags);
  const [categoryId, setCategoryId] = useState<string | null>(
    subTaskCategoryId,
  );
  const [requiresMaterialFlagsOnFinish, setRequiresMaterialFlagsOnFinish] =
    useState(initialRequiresFlags);
  const [flagIds, setFlagIds] = useState<string[]>(() =>
    resolveInitialMaterialFlagIds({
      availableFlags: initialFlags,
      assignedFlagCodes,
    }),
  );
  const [allowSemBandeiraOption, setAllowSemBandeiraOption] = useState(false);
  const [semBandeiraSelected, setSemBandeiraSelected] = useState(
    initialRequiresFlags && !subTaskCategoryId,
  );
  const [refreshPending, startRefresh] = useTransition();
  const actionsDisabled = disabled || busy;

  function applyFlagRefresh(result: {
    flags: MaterialFlagOption[];
    categoryId: string | null;
    requiresMaterialFlagsOnFinish?: boolean;
  } | null | undefined): void {
    if (!result) return;
    setAvailableFlags(result.flags);
    setCategoryId(result.categoryId);
    if (result.requiresMaterialFlagsOnFinish !== undefined) {
      setRequiresMaterialFlagsOnFinish(result.requiresMaterialFlagsOnFinish);
    }
    if (result.flags.length === 0) {
      setAllowSemBandeiraOption(Boolean(result.categoryId));
    } else {
      setAllowSemBandeiraOption(false);
      setSemBandeiraSelected(false);
    }
  }

  useEffect(() => {
    if (!onRefreshFlags) return;
    if (initialFlags.length > 0 || initialRequiresFlags) return;
    let cancelled = false;
    startRefresh(async () => {
      const result = await onRefreshFlags();
      if (!cancelled) applyFlagRefresh(result);
    });
    return () => {
      cancelled = true;
    };
    // Load picker options once when opening exit without listing payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  function withFlags<T extends object>(base: T): T | (T & { flagIds: string[] }) {
    if (flagIds.length === 0) return base;
    return { ...base, flagIds };
  }

  function flagsAllowConfirm(willFinish: boolean): boolean {
    return canConfirmFinishWithFlags({
      willFinish,
      hasDependents: requiresMaterialFlagsOnFinish,
      categoryId,
      selectedFlagCount: flagIds.length,
      availableFlagCount: availableFlags.length,
      semBandeiraSelected,
    });
  }

  function handleRefresh(): void {
    if (!onRefreshFlags) return;
    startRefresh(async () => {
      applyFlagRefresh(await onRefreshFlags());
    });
  }

  const flagPicker = (
    <KioskMaterialFlagPicker
      flags={availableFlags}
      selectedIds={flagIds}
      disabled={actionsDisabled}
      categoryId={categoryId}
      requiresMaterialFlagsOnFinish={requiresMaterialFlagsOnFinish}
      allowSemBandeiraOption={allowSemBandeiraOption}
      semBandeiraSelected={semBandeiraSelected}
      onSemBandeiraChange={setSemBandeiraSelected}
      onRefresh={onRefreshFlags ? handleRefresh : undefined}
      refreshing={refreshPending}
      onChange={setFlagIds}
    />
  );

  if (sharingType === "duration") {
    if (!allowComplete) {
      return (
        <div className="space-y-3 rounded-2xl border bg-muted p-3">
          <p className="text-base font-medium">{t("exitWithoutCompleteHint")}</p>
          {flagPicker}
          <div className="flex flex-col gap-2">
            <KioskActionButton
              actionVariant="produce"
              disabled={actionsDisabled || !flagsAllowConfirm(false)}
              onClick={() =>
                onConfirm(
                  withFlags({ sharingType: "duration", isCompleted: false }),
                )
              }
            >
              {busy ? t("actionLoading") : t("exitConfirm")}
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
        {flagPicker}
        <div className="flex flex-col gap-2">
          <KioskActionButton
            actionVariant="produce"
            disabled={actionsDisabled || !flagsAllowConfirm(true)}
            onClick={() =>
              onConfirm(
                withFlags({ sharingType: "duration", isCompleted: true }),
              )
            }
          >
            {busy ? t("actionLoading") : t("exitCompletedYes")}
          </KioskActionButton>
          <KioskActionButton
            actionVariant="outline"
            disabled={actionsDisabled || !flagsAllowConfirm(false)}
            onClick={() =>
              onConfirm(
                withFlags({ sharingType: "duration", isCompleted: false }),
              )
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

  const willFinishQty =
    allowComplete && (safeMaxQty === 0 || qtyCompleted >= safeMaxQty);

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
          {safeMaxQty === 0
            ? t("exitQtyNoneRemainingHint")
            : t("exitQtyMax", { max: safeMaxQty })}
        </p>
        {qtyError ? (
          <p className="text-sm text-destructive" role="alert">
            {qtyError}
          </p>
        ) : null}
      </div>
      {flagPicker}
      <div className="flex flex-col gap-2">
        <KioskActionButton
          actionVariant="produce"
          disabled={actionsDisabled || !flagsAllowConfirm(willFinishQty)}
          onClick={() => {
            if (!Number.isInteger(qtyCompleted) || qtyCompleted < 0) {
              setQtyError(t("exitQtyInvalid"));
              return;
            }
            if (qtyCompleted > safeMaxQty) {
              setQtyError(t("exitQtyExceeds"));
              return;
            }
            onConfirm(withFlags({ sharingType: "qty", qtyCompleted }));
          }}
        >
          {busy ? t("actionLoading") : t("exitConfirm")}
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
