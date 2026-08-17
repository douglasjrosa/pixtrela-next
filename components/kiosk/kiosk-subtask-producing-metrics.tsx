"use client";

import { useTranslations } from "next-intl";

import { formatDateTimePtBr } from "@/lib/format/datetime";
import { formatDurationHms } from "@/lib/format/duration";

import { KioskSubtaskMetricBlock } from "./kiosk-subtask-metric-block";
import { SubtaskElapsedTimer } from "./subtask-elapsed-timer";

export interface KioskSubtaskProducingMetricsProps {
  startedAt: string;
  timeSpent: number;
  expectedTime: number;
  timerPaused?: boolean;
}

export function KioskSubtaskProducingMetrics({
  startedAt,
  timeSpent,
  expectedTime,
  timerPaused = false,
}: KioskSubtaskProducingMetricsProps) {
  const t = useTranslations("kiosk");
  const tDuration = useTranslations("duration");

  return (
    <div className="space-y-3">
      <KioskSubtaskMetricBlock label={t("startedAt")}>
        {formatDateTimePtBr(startedAt)}
      </KioskSubtaskMetricBlock>
      <KioskSubtaskMetricBlock label={t("expectedTime")}>
        {formatDurationHms(expectedTime, (key, values) =>
          tDuration(key, values),
        )}
      </KioskSubtaskMetricBlock>
      <KioskSubtaskMetricBlock label={t("elapsed")}>
        <SubtaskElapsedTimer
          startedAt={startedAt}
          baseSeconds={timeSpent}
          expectedTime={expectedTime}
          paused={timerPaused}
        />
      </KioskSubtaskMetricBlock>
    </div>
  );
}
