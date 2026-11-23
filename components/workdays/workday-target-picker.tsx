"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CardBadge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { TargetOption } from "./types";

const SEARCH_THRESHOLD = 8;

export interface WorkdayTargetPickerProps {
  id: string;
  label: string;
  emptyLabel: string;
  options: TargetOption[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  error?: string;
}

function toggleTarget(value: string[], documentId: string): string[] {
  if (value.includes(documentId)) {
    return value.filter((item) => item !== documentId);
  }
  return [...value, documentId];
}

export function WorkdayTargetPicker({
  id,
  label,
  emptyLabel,
  options,
  value,
  onChange,
  disabled = false,
  error,
}: WorkdayTargetPickerProps) {
  const t = useTranslations("workdays");
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const visible = normalized
    ? options.filter((option) =>
        option.name.toLowerCase().includes(normalized),
      )
    : options;

  return (
    <div className="space-y-2">
      <Label id={id}>{label}</Label>
      {options.length >= SEARCH_THRESHOLD ? (
        <Input
          type="search"
          value={query}
          disabled={disabled}
          placeholder={t("filterTargetsPlaceholder")}
          onChange={(event) => setQuery(event.target.value)}
        />
      ) : null}
      <div
        role="group"
        aria-labelledby={id}
        className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-md border p-2"
      >
        {visible.length === 0 ? (
          <span className="text-sm text-muted-foreground">{emptyLabel}</span>
        ) : (
          visible.map((option) => {
            const selected = value.includes(option.documentId);
            return (
              <button
                key={option.documentId}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                aria-label={
                  selected
                    ? t("excludeTarget", { name: option.name })
                    : t("includeTarget", { name: option.name })
                }
                onClick={() =>
                  onChange(toggleTarget(value, option.documentId))
                }
              >
                <CardBadge
                  className={cn(
                    "cursor-pointer transition-colors",
                    disabled && "pointer-events-none opacity-50",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {option.name}
                </CardBadge>
              </button>
            );
          })
        )}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
