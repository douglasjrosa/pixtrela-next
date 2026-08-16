import { DEFAULT_TIME_ZONE } from "@/lib/business/datetime-timezone";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PT_BR_INPUT_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const PT_BR_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: DEFAULT_TIME_ZONE,
};

const PT_BR_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: DEFAULT_TIME_ZONE,
};

function formatDateOnlyParts(year: string, month: string, day: string): string {
  return `${day}/${month}/${year}`;
}

function parseDateValue(value: string): Date | null {
  const dateOnly = DATE_ONLY_PATTERN.exec(value.trim());
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Formats dates as dd/mm/yyyy for pt-BR UI. */
export function formatDatePtBr(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  const dateOnly = DATE_ONLY_PATTERN.exec(trimmed);
  if (dateOnly) {
    return formatDateOnlyParts(dateOnly[1], dateOnly[2], dateOnly[3]);
  }
  const date = parseDateValue(trimmed);
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR", PT_BR_DATE_OPTIONS);
}

/** Formats ISO yyyy-mm-dd for dd/mm/yyyy text inputs. */
export function formatIsoDateToPtBrInput(iso: string): string {
  const dateOnly = DATE_ONLY_PATTERN.exec(iso.trim());
  if (!dateOnly) return "";
  return formatDateOnlyParts(dateOnly[1], dateOnly[2], dateOnly[3]);
}

/** Parses dd/mm/yyyy input into ISO yyyy-mm-dd, or null when invalid. */
export function parsePtBrInputToIsoDate(value: string): string | null {
  const match = PT_BR_INPUT_PATTERN.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  const isoMonth = String(month).padStart(2, "0");
  const isoDay = String(day).padStart(2, "0");
  return `${year}-${isoMonth}-${isoDay}`;
}

/** Formats datetimes as dd/mm/yyyy, hh:mm for pt-BR UI. */
export function formatDateTimePtBr(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    ...PT_BR_DATE_OPTIONS,
    ...PT_BR_TIME_OPTIONS,
  });
}

/** Formats time as hh:mm for pt-BR UI. */
export function formatTimePtBr(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("pt-BR", PT_BR_TIME_OPTIONS);
}

/** Splits an ISO datetime into stacked date + time labels for pt-BR UI. */
export function splitDateTimePtBr(value: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!value) return { date: "—", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "—", time: "" };
  return {
    date: date.toLocaleDateString("pt-BR", PT_BR_DATE_OPTIONS),
    time: date.toLocaleTimeString("pt-BR", PT_BR_TIME_OPTIONS),
  };
}

export function elapsedSecondsSince(
  isoDate: string,
  nowMs: number,
): number {
  const startedMs = new Date(isoDate).getTime();
  if (Number.isNaN(startedMs)) return 0;
  const diff = Math.floor((nowMs - startedMs) / 1000);
  return Math.max(0, diff);
}
