const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_HOUR = 3600;

export type DurationMessageKey = "hoursMinutes" | "hoursOnly" | "minutesOnly";

export type HmsDurationMessageKey =
  | "hoursMinutesSeconds"
  | "minutesSeconds"
  | "secondsOnly";

export type DurationTranslator = (
  key: DurationMessageKey,
  values: { hours: number; minutes: number },
) => string;

export type HmsDurationTranslator = (
  key: HmsDurationMessageKey,
  values: { hours: number; minutes: number; seconds: number },
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

/** Formats seconds with live second precision (e.g. 5min 23s). */
export function formatDurationHms(
  totalSeconds: number,
  t: HmsDurationTranslator,
): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (safeSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );
  const seconds = safeSeconds % SECONDS_PER_MINUTE;

  if (hours > 0) {
    return t("hoursMinutesSeconds", { hours, minutes, seconds });
  }
  if (minutes > 0) {
    return t("minutesSeconds", { minutes, seconds });
  }
  return t("secondsOnly", { hours: 0, minutes: 0, seconds });
}
