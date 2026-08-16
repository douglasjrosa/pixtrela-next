export const TASK_LIST_MAX_DATE_RANGE_MONTHS = 3;

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDateOnlyLocal(iso: string): Date | null {
  const match = ISO_DATE_ONLY.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isTaskListDateRangeWithinMaxMonths(
  fromIso: string,
  toIso: string,
  maxMonths: number = TASK_LIST_MAX_DATE_RANGE_MONTHS,
): boolean {
  const from = parseIsoDateOnlyLocal(fromIso);
  const to = parseIsoDateOnlyLocal(toIso);
  if (!from || !to || from > to) return false;

  const limit = new Date(from);
  limit.setMonth(limit.getMonth() + maxMonths);
  return to.getTime() <= limit.getTime();
}
