"use client";

import type { MouseEvent, PointerEvent } from "react";
import { Link2, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Must stay taller than the link button so the vertical dash stays visible
 * above and below it (the C bracket, not two stubs from the button).
 */
export const SUBTASK_CHAIN_LIST_GAP_CLASS =
  "gap-[var(--subtask-chain-gap)] [--subtask-chain-gap:3.5rem]";

const LINK_COLUMN_CLASS =
  "relative flex h-full w-7 shrink-0 items-start justify-center";

/** Half column + row gap-1 + reach into the card's left edge. */
const CHAIN_ELBOW_WIDTH_CLASS = "w-[calc(50%+1.25rem)]";

const LINK_BUTTON_OFFSET_CLASS =
  "-mt-[calc(var(--subtask-chain-gap)/2+0.875rem)]";

export interface SubtaskChainLinkControlProps {
  linked: boolean;
  showButton?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  linkLabel: string;
  unlinkLabel: string;
  onToggle: (linked: boolean) => void;
}

export function SubtaskChainLinkControl({
  linked,
  showButton = true,
  hidden = false,
  disabled = false,
  linkLabel,
  unlinkLabel,
  onToggle,
}: SubtaskChainLinkControlProps) {
  const Icon = linked ? Link2 : Unlink;
  const showVisuals = showButton && !hidden;

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
      className={LINK_COLUMN_CLASS}
      data-testid={showButton ? "subtask-chain-link" : undefined}
      data-linked={linked ? "true" : "false"}
      data-hidden={hidden ? "true" : "false"}
    >
      {showVisuals && linked ? (
        <span
          className={cn(
            "pointer-events-none absolute left-1/2",
            "top-[calc(-1*var(--subtask-chain-gap))]",
            "h-[var(--subtask-chain-gap)]",
            CHAIN_ELBOW_WIDTH_CLASS,
            "border-b border-l border-t border-dashed border-primary",
          )}
          aria-hidden
          data-slot="chain-line"
        />
      ) : null}
      {showVisuals ? (
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          className={cn(
            "relative z-10 rounded-full",
            LINK_BUTTON_OFFSET_CLASS,
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
      ) : null}
    </div>
  );
}
