"use client";

import { useTranslations } from "next-intl";

import { CardBadge } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { UserOption } from "./types";

export interface TeamColaboratorPickerProps {
  id: string;
  label: string;
  colaborators: UserOption[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

function toggleIdInList(value: string[], documentId: string): string[] {
  if (value.includes(documentId)) {
    return value.filter((memberId) => memberId !== documentId);
  }
  return [...value, documentId];
}

export function TeamColaboratorPicker({
  id,
  label,
  colaborators,
  value,
  onChange,
  disabled = false,
}: TeamColaboratorPickerProps) {
  const tTeams = useTranslations("teams");

  return (
    <div className="space-y-2">
      <Label id={id}>{label}</Label>
      <div
        role="group"
        aria-labelledby={id}
        className="flex flex-wrap gap-1.5"
      >
        {colaborators.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            {tTeams("noColaborators")}
          </span>
        ) : (
          colaborators.map((colaborator) => {
            const selected = value.includes(colaborator.documentId);
            return (
              <button
                key={colaborator.documentId}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                aria-label={
                  selected
                    ? tTeams("excludeColaborator", { name: colaborator.name })
                    : tTeams("includeColaborator", { name: colaborator.name })
                }
                onClick={() =>
                  onChange(toggleIdInList(value, colaborator.documentId))
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
                  {colaborator.name}
                </CardBadge>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
