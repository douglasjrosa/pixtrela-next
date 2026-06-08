"use client";

import { useTranslations } from "next-intl";

import { formatDurationMinutes } from "@/lib/format/duration";

export interface DurationProps {
  seconds: number;
}

export function Duration({ seconds }: DurationProps) {
  const t = useTranslations("duration");
  return (
    <>
      {formatDurationMinutes(seconds, (key, values) => t(key, values))}
    </>
  );
}
