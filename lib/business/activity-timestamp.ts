import { DEFAULT_TIME_ZONE, toCalendarDateKey } from "@/lib/business/datetime-timezone";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_HM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HOUR_MAX = 23;
const MINUTE_MAX = 59;

function wallClockUtcMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "NaN");
  return Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour"),
    read("minute"),
    read("second"),
  );
}

/** Converts a calendar date + HH:mm in the app time zone to UTC. */
export function zonedDateTimeToUtc(
  dateIso: string,
  timeHm: string,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date | null {
  if (!DATE_ONLY.test(dateIso) || !TIME_HM.test(timeHm)) return null;
  const [year, month, day] = dateIso.split("-").map(Number);
  const [hour, minute] = timeHm.split(":").map(Number);
  if (
    hour > HOUR_MAX ||
    minute > MINUTE_MAX ||
    [year, month, day, hour, minute].some((part) => Number.isNaN(part))
  ) {
    return null;
  }
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const guess = new Date(asUtc);
  const offset = wallClockUtcMs(guess, timeZone) - guess.getTime();
  const corrected = new Date(asUtc - offset);
  const offset2 = wallClockUtcMs(corrected, timeZone) - corrected.getTime();
  return new Date(asUtc - offset2);
}

export function splitZonedDateTime(
  value: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: toCalendarDateKey(value, timeZone),
    time: `${read("hour")}:${read("minute")}`,
  };
}

/** `{name} {code}` when a code exists, otherwise the name alone. */
export function formatColaboratorLabel(
  name: string,
  code: number | null | undefined,
): string {
  const trimmed = name.trim();
  if (code == null) return trimmed;
  return `${trimmed} ${code}`;
}

/** `{subTask} - {task}` label used in the activities list and form. */
export function formatActivitySubtaskLabel(
  subTaskName: string,
  taskName: string,
): string {
  return `${subTaskName.trim()} - ${taskName.trim()}`;
}
