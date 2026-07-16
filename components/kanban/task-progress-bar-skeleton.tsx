import { cn } from "@/lib/utils";

/** Matches TaskProgressBar outer layout to avoid layout shift. */
export function TaskProgressBarSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("flex h-4 items-center gap-2", className)}
      data-testid="task-progress-bar-skeleton"
    >
      <div className="h-3 w-10 shrink-0 animate-pulse rounded bg-muted" />
      <div className="h-2 min-w-0 flex-1 animate-pulse rounded-full bg-muted" />
      <div className="h-3 w-10 shrink-0 animate-pulse rounded bg-muted" />
    </div>
  );
}
