"use client";

import type { MouseEvent, PointerEvent } from "react";
import { Link2, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Tight list gap — the link row owns the space between cards. */
export const SUBTASK_CHAIN_LIST_GAP_CLASS = "gap-1";

/** Matches the drag-handle column so the control lines up with the card. */
export const SUBTASK_CHAIN_GRIP_SPACER_CLASS = "w-6";

const LINK_ROW_HEIGHT_CLASS = "h-11";

export interface SubtaskChainLinkControlProps {
  linked: boolean;
  disabled?: boolean;
  linkLabel: string;
  unlinkLabel: string;
  onToggle: (linked: boolean) => void;
}

export function SubtaskChainLinkControl({
  linked,
  disabled = false,
  linkLabel,
  unlinkLabel,
  onToggle,
}: SubtaskChainLinkControlProps) {
  const Icon = linked ? Link2 : Unlink;

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    if (disabled) return;
    onToggle(!linked);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>): void {
    event.stopPropagation();
  }

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-start",
        LINK_ROW_HEIGHT_CLASS,
      )}
      data-testid="subtask-chain-link"
      data-linked={linked ? "true" : "false"}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 left-4 w-px",
          linked ? "bg-primary" : "border-l border-dashed border-muted-foreground/50",
        )}
        aria-hidden
        data-slot="chain-line"
      />
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        className={cn(
          "relative ml-0.5 rounded-full",
          linked ? "border-primary text-primary" : "text-muted-foreground",
        )}
        aria-pressed={linked}
        aria-label={linked ? unlinkLabel : linkLabel}
        disabled={disabled}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      >
        <Icon aria-hidden />
      </Button>
    </div>
  );
}
