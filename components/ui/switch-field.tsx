"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { APP_MENU_FONT_CLASS } from "@/lib/ui/app-menu-typography";
import { cn } from "@/lib/utils";

export interface SwitchFieldProps {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  onCheckedChange: (checked: boolean) => void;
}

/** Switch immediately left of its label, aligned to the start. */
export function SwitchField({
  id,
  label,
  checked,
  disabled = false,
  ariaLabel,
  className,
  size = "default",
  onCheckedChange,
}: SwitchFieldProps) {
  const labelSizeClass = size === "lg" ? APP_MENU_FONT_CLASS : "text-sm";
  const gapClass = size === "lg" ? "gap-4" : "gap-2";

  return (
    <div className={cn("flex items-center justify-start", gapClass, className)}>
      <Switch
        id={id}
        size={size}
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        onCheckedChange={onCheckedChange}
      />
      <Label htmlFor={id} className={cn("font-medium", labelSizeClass)}>
        {label}
      </Label>
    </div>
  );
}
