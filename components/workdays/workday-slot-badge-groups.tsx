"use client";

import { X } from "lucide-react";

import { CardBadge } from "@/components/ui/card";
import type { WorkdaySlotBadgeGroupLabel } from "@/lib/workdays/format-workday-row-labels";
import { cn } from "@/lib/utils";

export function WorkdaySlotBadgeGroups({
  groups,
  align = "center",
  onRemove,
  removeLabel,
  disabled = false,
}: {
  groups: WorkdaySlotBadgeGroupLabel[];
  align?: "center" | "start";
  onRemove?: (weekday: number, time: string) => void;
  removeLabel?: (weekdayLabel: string, time: string) => string;
  disabled?: boolean;
}) {
  if (groups.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      {groups.map((group) => (
        <div
          key={group.weekday}
          className="flex flex-wrap items-center gap-1"
        >
          <span className="w-8 shrink-0 text-xs text-muted-foreground">
            {group.weekdayLabel}
          </span>
          {group.times.map((time) => (
            <CardBadge
              key={`${group.weekday}-${time}`}
              className={cn(
                onRemove && "inline-flex items-center gap-1 pr-1",
              )}
            >
              <span>{time}</span>
              {onRemove ? (
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={
                    removeLabel
                      ? removeLabel(group.weekdayLabel, time)
                      : undefined
                  }
                  className="rounded p-0.5 hover:bg-muted"
                  onClick={() => onRemove(group.weekday, time)}
                >
                  <X className="size-3" aria-hidden />
                </button>
              ) : null}
            </CardBadge>
          ))}
        </div>
      ))}
    </div>
  );
}
