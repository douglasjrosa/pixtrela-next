"use client";

import { useTranslations } from "next-intl";

import { Duration } from "@/components/ui/duration";
import {
  isOverExpected,
  resolveProgressFillPercent,
  resolveProgressMarkPercent,
  resolveTaskRemainingSeconds,
  type BoardTaskProgressInput,
} from "@/lib/business/task-progress";
import { cn } from "@/lib/utils";

export interface TaskProgressBarProps {
  /** Persisted Task.totalTimeSpent (synced on activities; person-seconds). */
  totalTimeSpent: number;
  /** Persisted Task.totalExpectedTime (sum of scaled sub-task expectedTimes). */
  totalExpectedTime: number;
  progressInput: BoardTaskProgressInput;
  /** Clock from page load; remaining is recalculated each request. */
  nowMs: number;
}

export function TaskProgressBar({
  totalTimeSpent,
  totalExpectedTime,
  progressInput,
  nowMs,
}: TaskProgressBarProps) {
  const t = useTranslations("kanban");

  if (totalExpectedTime <= 0) return null;

  const remainingSeconds = resolveTaskRemainingSeconds(
    progressInput.subTasks,
    progressInput.openActivityStartedAts,
    nowMs,
  );
  const overExpected = isOverExpected(totalTimeSpent, totalExpectedTime);
  const fillPercent = resolveProgressFillPercent(
    totalExpectedTime,
    totalTimeSpent,
  );
  const markPercent = resolveProgressMarkPercent(
    totalExpectedTime,
    totalTimeSpent,
  );

  return (
    <div
      aria-label={t("progressTowardExpected")}
      aria-valuemax={totalExpectedTime}
      aria-valuemin={0}
      aria-valuenow={Math.min(totalTimeSpent, totalExpectedTime)}
      className="flex h-4 items-center gap-2"
      role="progressbar"
    >
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        <Duration seconds={totalTimeSpent} />
      </span>
      <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 bg-destructive/20"
          style={{ left: `${markPercent}%` }}
        />
        <div
          className={cn(
            "relative h-full transition-[width] duration-300 ease-out",
            overExpected ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${fillPercent}%` }}
        />
        <div
          aria-hidden
          className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-foreground/50"
          style={{ left: `${markPercent}%` }}
        />
      </div>
      <span
        className={cn(
          "shrink-0 text-xs tabular-nums",
          remainingSeconds < 0 ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {remainingSeconds < 0 ? "-" : null}
        <Duration seconds={Math.abs(remainingSeconds)} />
      </span>
    </div>
  );
}
