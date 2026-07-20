"use client";

import { useTranslations } from "next-intl";

import { ProgressTrack } from "@/components/kanban/progress-track";
import {
  resolveLiveTimeSpent,
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
}

export function SubTaskProgressBar({
  status,
  expectedTime,
  timeSpent,
  openActivityStartedAts,
}: SubTaskProgressBarProps) {
  const t = useTranslations("kanban");
  const nowMs = useLiveProgressClock(true);

  if (!shouldShowSubTaskProgress(status) || expectedTime <= 0) return null;

  const liveSpent = resolveLiveTimeSpent(
    timeSpent,
    openActivityStartedAts,
    nowMs,
  );
  const remainingSeconds = resolveSubTaskRemainingSeconds(
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
