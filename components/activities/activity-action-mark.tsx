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
        action === "started" ? "bg-green-600" : "bg-red-600",
      )}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
