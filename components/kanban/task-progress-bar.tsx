"use client";

import { useTranslations } from "next-intl";

import { ProgressTrack } from "@/components/kanban/progress-track";
import {
  resolveLiveTimeSpent,
  resolvePersistedRemainingSeconds,
  resolveProgressMarkPercent,
  resolveProgressOkFillPercent,
  resolveProgressOverFillPercent,
  resolveTaskRemainingSeconds,
  type BoardTaskProgressInput,
} from "@/lib/business/task-progress";

export interface TaskProgressBarProps {
  /** Persisted Task.totalTimeSpent (synced on activities; person-seconds). */
  totalTimeSpent: number;
  /** Persisted Task.totalExpectedTime (sum of scaled sub-task expectedTimes). */
  totalExpectedTime: number;
  progressInput: BoardTaskProgressInput;
  /** Clock; remaining and live fill recalculate from this. */
  nowMs: number;
  /**
   * When true, remaining uses only expected − spent (finished tasks).
   * When false, remaining uses unfinished sub-tasks + live open sessions.
   */
  usePersistedRemaining?: boolean;
}

export function TaskProgressBar({
  totalTimeSpent,
  totalExpectedTime,
  progressInput,
  nowMs,
  usePersistedRemaining = false,
}: TaskProgressBarProps) {
  const t = useTranslations("kanban");

  if (totalExpectedTime <= 0) return null;

  const openStarts = progressInput.openActivityStartedAts;
  const liveSpent = usePersistedRemaining
    ? Math.max(0, totalTimeSpent)
    : resolveLiveTimeSpent(totalTimeSpent, openStarts, nowMs);
  const remainingSeconds = usePersistedRemaining
    ? resolvePersistedRemainingSeconds(totalExpectedTime, totalTimeSpent)
    : resolveTaskRemainingSeconds(progressInput.subTasks, openStarts, nowMs);

  return (
    <ProgressTrack
      ariaLabel={t("progressTowardExpected")}
      expectedSec={totalExpectedTime}
      spentSec={liveSpent}
      remainingSec={remainingSeconds}
      markPercent={resolveProgressMarkPercent(totalExpectedTime, liveSpent)}
      okFillPercent={resolveProgressOkFillPercent(totalExpectedTime, liveSpent)}
      overFillPercent={resolveProgressOverFillPercent(
        totalExpectedTime,
        liveSpent,
      )}
    />
  );
}
