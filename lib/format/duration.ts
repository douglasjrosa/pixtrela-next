const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export type DurationMessageKey = "hoursMinutes" | "hoursOnly" | "minutesOnly";

export type DurationTranslator = (
  key: DurationMessageKey,
  values: { hours: number; minutes: number },
) => string;

/** Rounds seconds up to the next whole minute. */
export function ceilSecondsToMinutes(totalSeconds: number): number {
  return Math.ceil(Math.max(0, totalSeconds) / SECONDS_PER_MINUTE);
}

/** Formats seconds as "1h 30min" (always rounded up to minutes). */
export function formatDurationMinutes(
  totalSeconds: number,
  t: DurationTranslator,
): string {
  const totalMinutes = ceilSecondsToMinutes(totalSeconds);
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;

  if (hours > 0 && minutes > 0) {
    return t("hoursMinutes", { hours, minutes });
  }
  if (hours > 0) {
    return t("hoursOnly", { hours, minutes: 0 });
  }
  return t("minutesOnly", { hours: 0, minutes });
}
