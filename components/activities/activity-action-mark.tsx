import { activityActionBadgeBackgroundClass } from "@/lib/ui/activity-action-badge";
import { cn } from "@/lib/utils";

export type ActivityActionMarkProps = {
  action: "started" | "stoped";
  ariaLabel: string;
};

export function ActivityActionMark({ action, ariaLabel }: ActivityActionMarkProps) {
  return (
    <span
      className={cn(
        "inline-block size-3 shrink-0 rounded-full",
        activityActionBadgeBackgroundClass(action),
      )}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
