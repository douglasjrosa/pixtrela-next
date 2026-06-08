"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { elapsedSecondsSince } from "@/lib/format/datetime";
import { formatDurationMinutes } from "@/lib/format/duration";

const TICK_MS = 1000;

export function useElapsedTime(
  startedAt: string | null,
  baseSeconds = 0,
): string | null {
  const t = useTranslations("duration");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return undefined;
    const id = window.setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [startedAt]);

  if (!startedAt) return null;

  const elapsed = baseSeconds + elapsedSecondsSince(startedAt, nowMs);
  return formatDurationMinutes(elapsed, (key, values) => t(key, values));
}
