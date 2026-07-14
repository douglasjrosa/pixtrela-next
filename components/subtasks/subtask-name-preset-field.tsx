"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  shouldSearchSubTaskPresets,
  type SubTaskPreset,
} from "@/lib/business/subtask-preset";
import { cn } from "@/lib/utils";

async function searchPresets(query: string): Promise<SubTaskPreset[]> {
  const { searchSubTaskPresets } = await import(
    "@/app/(app)/sub-task-presets/actions"
  );
  return searchSubTaskPresets(query);
}

const PRESET_SEARCH_DEBOUNCE_MS = 300;

export interface SubTaskNamePresetFieldProps {
  id: string;
  label: string;
  value: string;
  enabled: boolean;
  disabled?: boolean;
  errorMessage?: string | null;
  onChange: (value: string) => void;
  onApplyPreset: (preset: SubTaskPreset) => void;
}

export function SubTaskNamePresetField({
  id,
  label,
  value,
  enabled,
  disabled = false,
  errorMessage,
  onChange,
  onApplyPreset,
}: SubTaskNamePresetFieldProps) {
  const tSubtasks = useTranslations("subtasks");
  const [presets, setPresets] = useState<SubTaskPreset[]>([]);
  const [isSearching, startSearch] = useTransition();

  useEffect(() => {
    if (!enabled || disabled) {
      setPresets([]);
      return;
    }

    if (!shouldSearchSubTaskPresets(value)) {
      setPresets([]);
      return;
    }

    const handle = window.setTimeout(() => {
      startSearch(async () => {
        try {
          const results = await searchPresets(value);
          setPresets(results);
        } catch {
          setPresets([]);
        }
      });
    }, PRESET_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [value, enabled, disabled]);

  const showSuggestions =
    enabled && !disabled && shouldSearchSubTaskPresets(value);

  return (
    <div className="relative space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      {showSuggestions ? (
        <div
          role="listbox"
          aria-label={tSubtasks("presetSuggestions")}
          className={cn(
            "absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border",
            "bg-background shadow-md",
          )}
        >
          {isSearching && presets.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground" role="status">
              {tSubtasks("presetsLoading")}
            </p>
          ) : null}
          {!isSearching && presets.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground" role="status">
              {tSubtasks("presetsEmpty")}
            </p>
          ) : null}
          {presets.map((preset) => (
            <button
              key={preset.documentId}
              type="button"
              role="option"
              className={cn(
                "flex w-full px-3 py-2 text-left text-sm",
                "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
              )}
              onClick={() => {
                onApplyPreset(preset);
                setPresets([]);
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
