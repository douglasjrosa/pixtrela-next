"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface SwitchFieldProps {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  onCheckedChange: (checked: boolean) => void;
}

/** Label + switch row for boolean form fields. */
export function SwitchField({
  id,
  label,
  checked,
  disabled = false,
  ariaLabel,
  className,
  onCheckedChange,
}: SwitchFieldProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
