"use client";

import { useTranslations } from "next-intl";

import { ProgressTrack } from "@/components/kanban/progress-track";
import {
  resolveLiveTimeSpent,
  resolvePersistedRemainingSeconds,
  resolveProgressMarkPercent,
  resolveProgressOkFillPercent,
  resolveProgressOverFillPercent,
  resolveSubTaskRemainingSeconds,
  shouldShowSubTaskProgress,
} from "@/lib/business/task-progress";
import { useLiveProgressClock } from "@/hooks/use-live-progress-clock";

export interface SubTaskProgressBarProps {
  status: string;
  expectedTime: number;
  timeSpent: number;
  openActivityStartedAts: string[];
  /** Finished subtasks use persisted remaining only. */
  usePersistedRemaining?: boolean;
}

export function SubTaskProgressBar({
  status,
  expectedTime,
  timeSpent,
  openActivityStartedAts,
  usePersistedRemaining = false,
}: SubTaskProgressBarProps) {
  const t = useTranslations("kanban");
  const nowMs = useLiveProgressClock(!usePersistedRemaining);

  if (!shouldShowSubTaskProgress(status) || expectedTime <= 0) return null;

  const liveSpent = usePersistedRemaining
    ? Math.max(0, timeSpent)
    : resolveLiveTimeSpent(timeSpent, openActivityStartedAts, nowMs);
  const remainingSeconds = usePersistedRemaining
    ? resolvePersistedRemainingSeconds(expectedTime, timeSpent)
    : resolveSubTaskRemainingSeconds(
        expectedTime,
        timeSpent,
        openActivityStartedAts,
        nowMs,
      );

  return (
    <ProgressTrack
      ariaLabel={t("progressTowardExpected")}
      expectedSec={expectedTime}
      spentSec={liveSpent}
      remainingSec={remainingSeconds}
      markPercent={resolveProgressMarkPercent(expectedTime, liveSpent)}
      okFillPercent={resolveProgressOkFillPercent(expectedTime, liveSpent)}
      overFillPercent={resolveProgressOverFillPercent(expectedTime, liveSpent)}
    />
  );
}
