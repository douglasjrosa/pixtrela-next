"use client";

import { useTranslations } from "next-intl";

import { Duration } from "@/components/ui/duration";
import { formatDateTimePtBr } from "@/lib/format/datetime";

import { SubtaskElapsedTimer } from "./subtask-elapsed-timer";

export interface KioskSubtaskProducingMetricsProps {
  startedAt: string;
  timeSpent: number;
  expectedTime: number;
}

export function KioskSubtaskProducingMetrics({
  startedAt,
  timeSpent,
  expectedTime,
}: KioskSubtaskProducingMetricsProps) {
  const t = useTranslations("kiosk");

  return (
    <div className="space-y-2 text-base text-muted-foreground">
      <p>
        {t("startedAt")}: {formatDateTimePtBr(startedAt)}
      </p>
      <p>
        {t("expectedTime")}:{" "}
        <span className="tabular-nums">
          <Duration seconds={expectedTime} />
        </span>
      </p>
      <p className="flex flex-wrap items-center gap-2">
        <span>{t("elapsed")}:</span>
        <SubtaskElapsedTimer
          startedAt={startedAt}
          baseSeconds={timeSpent}
          expectedTime={expectedTime}
        />
      </p>
    </div>
  );
}
