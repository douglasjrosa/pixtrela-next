"use client";

import { useTranslations } from "next-intl";

import type { MaterialFlagOption } from "@/lib/business/subtask-queue";

export function KioskMaterialFlagPicker({
  flags,
  selectedIds,
  disabled,
  onChange,
}: {
  flags: MaterialFlagOption[];
  selectedIds: string[];
  disabled?: boolean;
  onChange: (next: string[]) => void;
}) {
  const t = useTranslations("kiosk");
  if (flags.length === 0) return null;
  const selected = new Set(selectedIds);

  function toggle(id: string): void {
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
    </fieldset>
  );
}
