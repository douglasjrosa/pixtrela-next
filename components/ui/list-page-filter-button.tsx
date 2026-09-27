"use client";

import { Funnel } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface ListPageFilterButtonProps {
  ariaLabel: string;
  onClick: () => void;
}

export function ListPageFilterButton({
  ariaLabel,
  onClick,
}: ListPageFilterButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <Funnel aria-hidden />
    </Button>
  );
}
