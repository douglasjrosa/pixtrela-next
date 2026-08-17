"use client";

import type { MouseEvent, PointerEvent } from "react";
import { Link2, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Tight list gap; the upper dash uses the same token to enter the card above. */
export const SUBTASK_CHAIN_LIST_GAP_CLASS =
  "gap-[var(--subtask-chain-gap)] [--subtask-chain-gap:0.5rem]";

const LINK_COLUMN_CLASS =
  "relative flex h-full w-7 shrink-0 flex-col items-center";

const CHAIN_UPPER_LINE_CLASS =
  "top-[calc(-1*var(--subtask-chain-gap)-1.75rem)] " +
  "h-[calc(var(--subtask-chain-gap)+1.75rem)]";

/** Half column + row gap-1 + reach into the card's left edge. */
const CHAIN_ELBOW_WIDTH_CLASS = "w-[calc(50%+0.25rem)]";

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
            CHAIN_UPPER_LINE_CLASS,
            CHAIN_ELBOW_WIDTH_CLASS,
            "border-l border-t border-dashed border-primary",
          )}
          aria-hidden
          data-slot="chain-line-upper"
        />
      ) : null}
      {showVisuals ? (
        <>
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
          {linked ? (
            <span
              className={cn(
                "pointer-events-none ml-[50%] h-7",
                CHAIN_ELBOW_WIDTH_CLASS,
                "border-b border-l border-dashed border-primary",
              )}
              aria-hidden
              data-slot="chain-line-lower"
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
