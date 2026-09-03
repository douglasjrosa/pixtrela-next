"use client";

import { useTranslations } from "next-intl";

import type { MaterialFlagOption } from "@/lib/business/subtask-queue";

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
}: {
  flags: MaterialFlagOption[];
  selectedIds: string[];
  disabled?: boolean;
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

  if (lockedSemBandeira) {
    return (
      <fieldset className="space-y-2">
        <legend className="text-base font-medium">{t("materialFlags")}</legend>
        <span
          aria-pressed
          className="inline-flex rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm"
        >
          {t("semBandeira")}
        </span>
      </fieldset>
    );
  }

  if (showRefreshEmpty) {
    return (
      <fieldset className="space-y-2">
        <legend className="text-base font-medium">{t("materialFlags")}</legend>
        <p className="text-sm text-muted-foreground">
          {t("materialFlagsUnavailable")}
        </p>
        {onRefresh ? (
          <button
            type="button"
            disabled={disabled || refreshing}
            className="text-sm font-medium underline"
            onClick={onRefresh}
          >
            {refreshing ? t("actionLoading") : t("refreshFlags")}
          </button>
        ) : null}
        {allowSemBandeiraOption ? (
          <button
            type="button"
            disabled={disabled}
            aria-pressed={semBandeiraSelected}
            className={
              "rounded-full border px-3 py-1 text-sm " +
              (semBandeiraSelected
                ? "border-primary bg-primary/10"
                : "bg-background")
            }
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
      <legend className="text-base font-medium">{t("materialFlags")}</legend>
      <p className="text-sm text-muted-foreground">{t("materialFlagHint")}</p>
      <div className="flex flex-wrap gap-2">
        {flags.map((flag) => {
          const isOn = selected.has(flag.id);
          return (
            <button
              key={flag.id}
              type="button"
              disabled={disabled}
              aria-pressed={isOn}
              className={
                "rounded-full border px-3 py-1 font-mono text-sm " +
                (isOn ? "border-primary bg-primary/10" : "bg-background")
              }
              onClick={() => toggle(flag.id)}
            >
              {flag.code}
            </button>
          );
        })}
      </div>
      {onRefresh ? (
        <button
          type="button"
          disabled={disabled || refreshing}
          className="text-sm underline"
          onClick={onRefresh}
        >
          {refreshing ? t("actionLoading") : t("refreshFlags")}
        </button>
      ) : null}
    </fieldset>
  );
}
