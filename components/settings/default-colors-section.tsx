"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { SettingsSectionHeading } from "@/components/settings/settings-section-heading";
import {
  SemanticColorField,
  semanticColorFieldId,
} from "@/components/settings/semantic-color-field";
import {
  matchSemanticThemePreset,
  SEMANTIC_THEME_PRESETS,
  type SemanticThemePresetId,
} from "@/lib/themes/semantic-theme-presets";
import {
  clearSemanticThemePreview,
  applySemanticThemePreview,
} from "@/lib/themes/semantic-theme-preview";
import {
  DEFAULT_SEMANTIC_TOKENS,
  SEMANTIC_TOKEN_GROUPS,
  semanticTokenLabelKey,
  type SemanticTokenKey,
  type SemanticTokens,
} from "@/lib/themes/semantic-tokens";
import { cn } from "@/lib/utils";

export interface DefaultColorsSectionProps {
  initialTokens: SemanticTokens;
  onSave: (tokens: SemanticTokens) => Promise<void>;
}

function PresetSwatch({ tokens }: { tokens: SemanticTokens }) {
  const colors = [
    tokens.primary,
    tokens.background,
    tokens.success,
    tokens.warning,
    tokens.foreground,
  ];
  return (
    <span className="flex h-8 w-full overflow-hidden rounded-md border border-border">
      {colors.map((color, index) => (
        <span
          key={`${index}-${color}`}
          className="h-full flex-1"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

export function DefaultColorsSection({
  initialTokens,
  onSave,
}: DefaultColorsSectionProps) {
  const router = useRouter();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [draft, setDraft] = useState<SemanticTokens>(initialTokens);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const savedBaselineRef = useRef(initialTokens);
  const initialKey = JSON.stringify(initialTokens);
  const [prevInitialKey, setPrevInitialKey] = useState(initialKey);
  if (initialKey !== prevInitialKey) {
    setPrevInitialKey(initialKey);
    setDraft(initialTokens);
    savedBaselineRef.current = initialTokens;
  }
  const busy = isPending || isSaving;
  const selectedPresetId = matchSemanticThemePreset(draft);

  useLayoutEffect(() => {
    applySemanticThemePreview(draft);
  }, [draft]);

  useLayoutEffect(() => {
    return () => {
      clearSemanticThemePreview(savedBaselineRef.current);
    };
  }, []);

  function patchToken(key: SemanticTokenKey, value: string): void {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }

  function applyPreset(id: SemanticThemePresetId): void {
    const preset = SEMANTIC_THEME_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setDraft({ ...preset.tokens });
    setMessage(null);
  }

  function restoreDefaults(): void {
    setDraft({ ...DEFAULT_SEMANTIC_TOKENS });
    setMessage(null);
  }

  async function handleSave(): Promise<void> {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(draft);
      savedBaselineRef.current = draft;
      applySemanticThemePreview(draft);
      setMessage(t("defaultColorsSaved"));
      router.refresh();
    } catch {
      setMessage(t("error"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <SettingsSectionHeading title={t("defaultColorsTitle")} />

      <div className="flex flex-wrap gap-3">
        {SEMANTIC_THEME_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={busy}
              aria-pressed={isSelected}
              className={cn(
                "flex w-36 shrink-0 flex-col gap-2",
                "rounded-xl border p-3 text-left transition-colors",
                "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-ring disabled:opacity-50",
                isSelected && "border-primary bg-primary/10 ring-2 ring-primary",
              )}
              onClick={() => startTransition(() => applyPreset(preset.id))}
            >
              <PresetSwatch tokens={preset.tokens} />
              <span className="text-sm font-medium">{t(preset.labelKey)}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {SEMANTIC_TOKEN_GROUPS.map((group) => (
          <div key={group.id} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {t(group.labelKey)}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.keys.map((key) => (
                <SemanticColorField
                  key={key}
                  id={semanticColorFieldId(key)}
                  label={t(semanticTokenLabelKey(key))}
                  value={draft[key]}
                  disabled={busy}
                  onChange={(value) => patchToken(key, value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={handleSave}>
          {tCommon("save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={restoreDefaults}
        >
          {t("defaultColorsRestore")}
        </Button>
      </div>

      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
    </section>
  );
}
