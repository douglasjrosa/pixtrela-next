"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SemanticTokenKey } from "@/lib/themes/semantic-tokens";
import { cn } from "@/lib/utils";

export interface SemanticColorFieldProps {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
}

function pickerValue(value: string, fallback: string): string {
  return /^#([0-9A-Fa-f]{6})$/.test(value) ? value : fallback;
}

export function SemanticColorField({
  id,
  label,
  value,
  disabled = false,
  onChange,
  className,
}: SemanticColorFieldProps) {
  const swatchColor = pickerValue(value, "#000000");

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={id}
          type="color"
          className="h-10 w-14 shrink-0 cursor-pointer p-1"
          value={swatchColor}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          aria-label={label}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 font-mono text-sm"
        />
        <span
          aria-hidden
          className="inline-block h-10 w-10 shrink-0 rounded-md border border-border"
          style={{ backgroundColor: swatchColor }}
        />
      </div>
    </div>
  );
}

export function semanticColorFieldId(key: SemanticTokenKey): string {
  return `semantic-token-${key}`;
}
