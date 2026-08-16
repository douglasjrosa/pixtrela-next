"use client";

import { useTranslations } from "next-intl";

function formatExchangeDay(day: number): string {
  const normalized = Math.max(1, Math.min(31, Math.floor(day)));
  return String(normalized).padStart(2, "0");
}

export interface TeamExchangePeriodLabelProps {
  firstDay: number;
  lastDay: number;
}

export function TeamExchangePeriodLabel({
  firstDay,
  lastDay,
}: TeamExchangePeriodLabelProps) {
  const tTeams = useTranslations("teams");
  const first = formatExchangeDay(firstDay);
  const last = formatExchangeDay(lastDay);

  return (
    <span>
      <span className="text-muted-foreground">
        {tTeams("exchangePeriodFrom")}{" "}
      </span>
      <span className="font-semibold text-foreground">{first}</span>
      <span className="text-muted-foreground"> {tTeams("exchangePeriodTo")} </span>
      <span className="font-semibold text-foreground">{last}</span>
    </span>
  );
}
