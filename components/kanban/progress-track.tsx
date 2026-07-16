import { Duration } from "@/components/ui/duration";
import { cn } from "@/lib/utils";

export interface ProgressTrackProps {
  ariaLabel: string;
  expectedSec: number;
  spentSec: number;
  remainingSec: number;
  markPercent: number;
  okFillPercent: number;
  overFillPercent: number;
}

/** Shared dual-fill track: success until mark, destructive only for excess. */
export function ProgressTrack({
  ariaLabel,
  expectedSec,
  spentSec,
  remainingSec,
  markPercent,
  okFillPercent,
  overFillPercent,
}: ProgressTrackProps) {
  return (
    <div
      aria-label={ariaLabel}
      aria-valuemax={expectedSec}
      aria-valuemin={0}
      aria-valuenow={Math.min(spentSec, expectedSec)}
      className="flex h-4 items-center gap-2"
      role="progressbar"
    >
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        <Duration seconds={spentSec} />
      </span>
      <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 bg-destructive/20"
          style={{ left: `${markPercent}%` }}
        />
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 bg-success transition-[width] duration-300 ease-out"
          style={{ width: `${okFillPercent}%` }}
        />
        {overFillPercent > 0 ? (
          <div
            aria-hidden
            className="absolute inset-y-0 bg-destructive transition-[width] duration-300 ease-out"
            style={{
              left: `${okFillPercent}%`,
              width: `${overFillPercent}%`,
            }}
          />
        ) : null}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-foreground/50"
          style={{ left: `${markPercent}%` }}
        />
      </div>
      <span
        className={cn(
          "shrink-0 text-xs tabular-nums",
          remainingSec < 0 ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {remainingSec < 0 ? "-" : null}
        <Duration seconds={Math.abs(remainingSec)} />
      </span>
    </div>
  );
}
