"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEACTIVATION_REASON_MIN_LENGTH_KEY } from "@/lib/schemas/deactivation-reason";

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
      <Textarea
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
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
