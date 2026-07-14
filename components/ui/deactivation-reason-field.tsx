"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import { DEACTIVATION_REASON_MIN_LENGTH_KEY } from "@/lib/schemas/deactivation-reason";
import { cn } from "@/lib/utils";

export interface DeactivationReasonFieldProps {
  id: string;
  label: string;
  value: string;
  errorMessage?: string | null;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function DeactivationReasonField({
  id,
  label,
  value,
  errorMessage,
  disabled = false,
  onChange,
}: DeactivationReasonFieldProps) {
  const tCommon = useTranslations("common");

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2",
          "text-sm shadow-sm placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
      {errorMessage ? (
        <p className="text-sm text-destructive">
          {errorMessage === DEACTIVATION_REASON_MIN_LENGTH_KEY
            ? tCommon(DEACTIVATION_REASON_MIN_LENGTH_KEY)
            : errorMessage}
        </p>
      ) : null}
    </div>
  );
}
