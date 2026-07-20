"use client";

import { Timer } from "lucide-react";
import { useTranslations } from "next-intl";

import { Duration } from "@/components/ui/duration";
import { cn } from "@/lib/utils";

export interface TimeMetricsProps {
  expectedTime: number;
  timeSpent: number;
  className?: string;
}

type MetricTone = "muted" | "warning" | "success" | "danger";

const TONE_CLASS: Record<MetricTone, string> = {
  muted: "text-muted-foreground",
  warning: "text-yellow-600",
  success: "text-success",
  danger: "text-destructive",
};

function TimeMetric({
  seconds,
  label,
  tone,
  showSign = false,
}: {
  seconds: number;
  label: string;
  tone: MetricTone;
  showSign?: boolean;
}) {
  const isNegative = seconds < 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs tabular-nums",
        TONE_CLASS[tone],
      )}
      title={label}
      aria-label={`${label}: ${seconds}`}
    >
      <Timer className="size-3.5 shrink-0" aria-hidden />
      {showSign && isNegative ? <span aria-hidden>-</span> : null}
      <Duration seconds={Math.abs(seconds)} />
    </span>
  );
}

/**
 * Displays estimated, spent, and balance (expected − spent) times.
 * Callers pass task or sub-task totals — this component only renders them.
 */
export function TimeMetrics({
  expectedTime,
  timeSpent,
  className,
}: TimeMetricsProps) {
  const t = useTranslations("kanban");
  const balanceSec = expectedTime - timeSpent;
  const balanceGained = balanceSec >= 0;

  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <TimeMetric
        seconds={expectedTime}
        label={t("timeEstimated")}
        tone="muted"
      />
      <TimeMetric seconds={timeSpent} label={t("timeSpent")} tone="warning" />
      <TimeMetric
        seconds={balanceSec}
        label={balanceGained ? t("timeGained") : t("timeLost")}
        tone={balanceGained ? "success" : "danger"}
        showSign
      />
    </div>
  );
}
