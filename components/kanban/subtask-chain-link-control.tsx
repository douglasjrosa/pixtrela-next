"use client";

import type { MouseEvent, PointerEvent } from "react";
import { Link2, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Card list gap; the dashed connector uses the same token to reach the card above. */
export const SUBTASK_CHAIN_LIST_GAP_CLASS =
  "gap-[var(--subtask-chain-gap)] [--subtask-chain-gap:0.75rem]";

const LINK_COLUMN_CLASS =
  "relative flex h-full w-7 shrink-0 items-center justify-center";

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
            "pointer-events-none absolute bottom-1/2 left-1/2 w-0",
            "-translate-x-1/2 border-l border-dashed border-primary",
            "top-[calc(-1*var(--subtask-chain-gap))]",
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
