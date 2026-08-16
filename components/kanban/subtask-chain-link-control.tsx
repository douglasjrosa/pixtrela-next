"use client";

import type { MouseEvent, PointerEvent } from "react";
import { Link2, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** List gap that leaves room for the mid-gap chain button and line stubs. */
export const SUBTASK_CHAIN_LIST_GAP_CLASS = "gap-12";

/** Half of `gap-12` — anchor sits in the middle of the gap above this card. */
const GAP_MID_OFFSET_CLASS = "-top-6";

/** Line stub from each card edge to the button (half of `gap-12`). */
const LINE_STUB_HEIGHT_CLASS = "h-6";

export interface SubtaskChainLinkControlProps {
  linked: boolean;
  disabled?: boolean;
  linkLabel: string;
  unlinkLabel: string;
  onToggle: (linked: boolean) => void;
}

function chainLineClass(linked: boolean, side: "above" | "below"): string {
  return cn(
    "pointer-events-none absolute left-0 -translate-x-1/2",
    LINE_STUB_HEIGHT_CLASS,
    side === "above" ? "bottom-full" : "top-full",
    linked
      ? "w-px bg-primary"
      : "w-0 border-l border-dashed border-muted-foreground/50",
  );
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
      className={cn("absolute left-0 z-20", GAP_MID_OFFSET_CLASS)}
      data-testid="subtask-chain-link"
      data-linked={linked ? "true" : "false"}
    >
      <span
        className={chainLineClass(linked, "above")}
        aria-hidden
        data-slot="chain-line-above"
      />
      <span
        className={chainLineClass(linked, "below")}
        aria-hidden
        data-slot="chain-line-below"
      />
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        className={cn(
          "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full",
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
