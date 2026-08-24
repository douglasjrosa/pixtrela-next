"use client";

import { Button } from "@/components/ui/button";

export function CartQtyButton({
  label,
  disabled = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className="min-h-10 min-w-10 rounded-xl px-0"
      aria-label={label}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
