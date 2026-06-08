const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const PT_BR_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

function parseDateValue(value: string): Date | null {
  const dateOnly = DATE_ONLY_PATTERN.exec(value.trim());
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const date = new Date(year, month - 1, day);
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
  const date = parseDateValue(value);
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR", PT_BR_DATE_OPTIONS);
}

/** Formats datetimes as dd/mm/yyyy, hh:mm for pt-BR UI. */
export function formatDateTimePtBr(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    ...PT_BR_DATE_OPTIONS,
    hour: "2-digit",
    minute: "2-digit",
  });
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
