import { cn } from "@/lib/utils";
import { KANBAN_UNASSIGNED_FLOATING_BADGE_CLASS_NAME } from "@/lib/business/kanban-status-badge";

export interface KanbanFloatingCountBadgeProps {
  count: number;
  ariaLabel: string;
  className?: string;
  display?: string;
  valueClassName?: string;
}

/** Orange floating count badge that overflows the parent corner. */
export function KanbanFloatingCountBadge({
  count,
  ariaLabel,
  className,
  display,
  valueClassName,
}: KanbanFloatingCountBadgeProps) {
  if (count < 0) return null;
  if (count === 0 && display === undefined) return null;

  return (
    <div
      className={cn(
        "absolute -right-2 -top-2 z-10 flex justify-end",
        className,
      )}
    >
      <span
        aria-label={ariaLabel}
        className={cn(
          KANBAN_UNASSIGNED_FLOATING_BADGE_CLASS_NAME,
          valueClassName,
        )}
      >
        {display ?? count}
      </span>
    </div>
  );
}
