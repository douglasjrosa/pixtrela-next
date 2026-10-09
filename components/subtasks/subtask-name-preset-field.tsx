"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateSubTaskNameError } from "@/lib/business/subtask-name-error";
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
  const nameError = translateSubTaskNameError(
    errorMessage ?? undefined,
    tSubtasks,
  );
  const [presets, setPresets] = useState<SubTaskPreset[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const canSearch =
    enabled && !disabled && shouldSearchSubTaskPresets(value);
  const showSuggestions = suggestionsOpen && canSearch && presets.length > 0;

  useEffect(() => {
    if (!canSearch || !suggestionsOpen) return;

    let cancelled = false;
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const results = await searchPresets(value);
          if (!cancelled) setPresets(results);
        } catch {
          if (!cancelled) setPresets([]);
        }
      })();
    }, PRESET_SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [value, canSearch, suggestionsOpen]);

  function handleNameChange(next: string): void {
    setSuggestionsOpen(true);
    onChange(next);
  }

  function handleApplyPresetOption(preset: SubTaskPreset): void {
    setSuggestionsOpen(false);
    setPresets([]);
    onApplyPreset(preset);
  }

  return (
    <div className="relative space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => handleNameChange(event.target.value)}
      />
      {nameError ? (
        <p className="text-sm text-destructive">{nameError}</p>
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
          {presets.map((preset) => (
            <button
              key={preset.documentId}
              type="button"
              role="option"
              aria-selected={false}
              className={cn(
                "flex w-full px-3 py-2 text-left text-sm",
                "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
              )}
              onClick={() => handleApplyPresetOption(preset)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
