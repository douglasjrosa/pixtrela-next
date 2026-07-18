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
  /** When true, in-budget fill uses success green instead of blue. */
  okFillSuccess?: boolean;
}

/** Shared dual-fill track: blue (or success) until mark, red for excess. */
export function ProgressTrack({
  ariaLabel,
  expectedSec,
  spentSec,
  remainingSec,
  markPercent,
  okFillPercent,
  overFillPercent,
  okFillSuccess = false,
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
      <span className="shrink-0 text-[0.7rem] tabular-nums text-muted-foreground">
        <Duration seconds={spentSec} />
      </span>
      <div className="relative h-[3px] min-w-0 flex-1 overflow-hidden rounded-full bg-muted-foreground/25">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 bg-red-400/20"
          style={{ left: `${markPercent}%` }}
        />
        <div
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 transition-[width] duration-300 ease-out",
            okFillSuccess ? "bg-success" : "bg-blue-500",
          )}
          style={{ width: `${okFillPercent}%` }}
        />
        {overFillPercent > 0 ? (
          <div
            aria-hidden
            className="absolute inset-y-0 bg-red-400 transition-[width] duration-300 ease-out"
            style={{
              left: `${okFillPercent}%`,
              width: `${overFillPercent}%`,
            }}
          />
        ) : null}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-card"
          style={{ left: `${markPercent}%` }}
        />
      </div>
      <span
        className={cn(
          "shrink-0 text-[0.7rem] tabular-nums",
          remainingSec < 0 ? "text-red-400" : "text-muted-foreground",
        )}
      >
        {remainingSec < 0 ? "-" : null}
        <Duration seconds={Math.abs(remainingSec)} />
      </span>
    </div>
  );
}
