"use client";

import { useTranslations } from "next-intl";

import type { ProductiveWindowDto } from "@/lib/domain/workday-coverage";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { formatDurationHms } from "@/lib/format/duration";

import { useProducingCardMetricsVisibility } from "./kiosk-producing-card-metrics-provider";
import { KioskSubtaskMetricBlock } from "./kiosk-subtask-metric-block";
import { SubtaskElapsedTimer } from "./subtask-elapsed-timer";

export interface KioskSubtaskProducingMetricsProps {
  startedAt: string;
  timeSpent: number;
  expectedTime: number;
  timerPaused?: boolean;
  productiveWindows?: readonly ProductiveWindowDto[];
}

export function KioskSubtaskProducingMetrics({
  startedAt,
  timeSpent,
  expectedTime,
  timerPaused = false,
  productiveWindows,
}: KioskSubtaskProducingMetricsProps) {
  const t = useTranslations("kiosk");
  const tDuration = useTranslations("duration");
  const visibility = useProducingCardMetricsVisibility();
  const showAny =
    visibility.showStartedAt ||
    visibility.showExpectedTime ||
    visibility.showElapsed;
  if (!showAny) return null;

  return (
    <div className="space-y-3">
      {visibility.showStartedAt ? (
        <KioskSubtaskMetricBlock label={t("startedAt")}>
          {formatDateTimePtBr(startedAt)}
        </KioskSubtaskMetricBlock>
      ) : null}
      {visibility.showExpectedTime ? (
        <KioskSubtaskMetricBlock label={t("expectedTime")}>
          {formatDurationHms(expectedTime, (key, values) =>
            tDuration(key, values),
          )}
        </KioskSubtaskMetricBlock>
      ) : null}
      {visibility.showElapsed ? (
        <KioskSubtaskMetricBlock label={t("elapsed")}>
          <SubtaskElapsedTimer
            startedAt={startedAt}
            baseSeconds={timeSpent}
            expectedTime={expectedTime}
            paused={timerPaused}
            productiveWindows={productiveWindows}
          />
        </KioskSubtaskMetricBlock>
      ) : null}
    </div>
  );
}
