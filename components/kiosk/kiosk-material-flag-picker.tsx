"use client";

import { FlagTriangleRight, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { MaterialFlagOption } from "@/lib/business/subtask-queue";
import { cn } from "@/lib/utils";

import { SemBandeiraInfoBadge } from "./sem-bandeira-info-badge";

function MaterialFlagsFieldsetHeader({
  title,
  onRefresh,
  disabled,
  refreshing,
  refreshLabel,
  loadingLabel,
}: {
  title: string;
  onRefresh?: () => void;
  disabled?: boolean;
  refreshing?: boolean;
  refreshLabel: string;
  loadingLabel: string;
}) {
  return (
    <legend className="flex w-full items-center justify-between gap-2 text-base font-medium">
      <span>{title}</span>
      {onRefresh ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          disabled={disabled || refreshing}
          aria-label={refreshing ? loadingLabel : refreshLabel}
          onClick={onRefresh}
        >
          <RefreshCw
            className={cn(refreshing && "animate-spin")}
            aria-hidden
          />
        </Button>
      ) : null}
    </legend>
  );
}

export function KioskMaterialFlagPicker({
  flags,
  selectedIds,
  disabled,
  onChange,
  categoryId,
  requiresMaterialFlagsOnFinish = false,
  allowSemBandeiraOption = false,
  semBandeiraSelected = false,
  onSemBandeiraChange,
  onRefresh,
  refreshing = false,
  scrollableFlags = false,
}: {
  flags: MaterialFlagOption[];
  selectedIds: string[];
  disabled?: boolean;
  scrollableFlags?: boolean;
  onChange: (next: string[]) => void;
  categoryId?: string | null;
  requiresMaterialFlagsOnFinish?: boolean;
  allowSemBandeiraOption?: boolean;
  semBandeiraSelected?: boolean;
  onSemBandeiraChange?: (selected: boolean) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const t = useTranslations("kiosk");
  const lockedSemBandeira =
    requiresMaterialFlagsOnFinish && !categoryId;
  const showRefreshEmpty =
    Boolean(categoryId) &&
    requiresMaterialFlagsOnFinish &&
    flags.length === 0;
  const showOptionalEmpty =
    !requiresMaterialFlagsOnFinish && flags.length === 0;

  if (showOptionalEmpty) return null;

  const fieldsetHeader = (
    <MaterialFlagsFieldsetHeader
      title={t("materialFlags")}
      onRefresh={onRefresh}
      disabled={disabled}
      refreshing={refreshing}
      refreshLabel={t("refreshFlags")}
      loadingLabel={t("actionLoading")}
    />
  );

  if (lockedSemBandeira) {
    return (
      <fieldset className="space-y-2">
        {fieldsetHeader}
        <SemBandeiraInfoBadge />
      </fieldset>
    );
  }

  if (showRefreshEmpty) {
    return (
      <fieldset className="space-y-2">
        {fieldsetHeader}
        <p className="text-sm text-muted-foreground">
          {t("materialFlagsUnavailable")}
        </p>
        {allowSemBandeiraOption ? (
          <button
            type="button"
            disabled={disabled}
            aria-pressed={semBandeiraSelected}
            className={cn(
              "rounded-md border px-3 py-1 text-sm",
              semBandeiraSelected
                ? "border-primary bg-primary/10"
                : "bg-background",
            )}
            onClick={() => onSemBandeiraChange?.(!semBandeiraSelected)}
          >
            {t("semBandeira")}
          </button>
        ) : null}
      </fieldset>
    );
  }

  const selected = new Set(selectedIds);

  function toggle(id: string): void {
    onSemBandeiraChange?.(false);
    if (selected.has(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedIds, id]);
  }

  return (
    <fieldset className="space-y-2">
      {fieldsetHeader}
      <p className="text-sm text-muted-foreground">{t("materialFlagHint")}</p>
      <div
        className={cn(
          scrollableFlags &&
            "min-h-0 max-h-[min(32vh,14rem)] overflow-y-auto overscroll-contain",
        )}
      >
        <div className="flex flex-wrap gap-2">
        {flags.map((flag) => {
          const isOn = selected.has(flag.id);
          return (
            <button
              key={flag.id}
              type="button"
              disabled={disabled}
              aria-pressed={isOn}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1",
                "font-mono text-sm",
                isOn ? "border-primary bg-primary/10" : "bg-background",
              )}
              onClick={() => toggle(flag.id)}
            >
              <FlagTriangleRight
                className={cn(
                  "size-4 shrink-0",
                  isOn ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden
                strokeWidth={2}
              />
              {flag.code}
            </button>
          );
        })}
        </div>
      </div>
    </fieldset>
  );
}
