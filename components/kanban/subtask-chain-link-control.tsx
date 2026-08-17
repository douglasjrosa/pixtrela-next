"use client";

import type { MouseEvent, PointerEvent } from "react";
import { Link2, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Tight list gap; the C-frame height includes this token. */
export const SUBTASK_CHAIN_LIST_GAP_CLASS =
  "gap-[var(--subtask-chain-gap)] [--subtask-chain-gap:0.5rem]";

const LINK_COLUMN_CLASS =
  "relative flex h-full w-7 shrink-0 flex-col items-center";

const CHAIN_FRAME_CLASS = cn(
  "pointer-events-none absolute left-1/2 top-3.5 z-0 -translate-y-1/2",
  "h-[calc(var(--subtask-chain-gap)+5rem)] w-5",
  "border-2 border-b border-l border-r-0 border-t border-dashed border-primary",
);

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
        <div
          className={CHAIN_FRAME_CLASS}
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
