import type { WorkdaySlotInput } from "@/lib/schemas/workday";

export const MAX_DATE_RANGE_DAYS = 366;
export const WEEKDAY_MONDAY_TO_FRIDAY = [1, 2, 3, 4, 5] as const;

const MS_PER_DAY = 86_400_000;

function toUtcDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUtcDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function slotIdentityKey(slot: WorkdaySlotInput): string {
  return [
    slot.isRecurrent ? "R" : "D",
    slot.dayOfWeek ?? "",
    slot.date ?? "",
    slot.allDay ? "A" : "T",
    slot.startMinute ?? "",
    slot.endMinute ?? "",
  ].join("|");
}

function compareSlots(a: WorkdaySlotInput, b: WorkdaySlotInput): number {
  if (a.isRecurrent !== b.isRecurrent) {
    return a.isRecurrent ? -1 : 1;
  }
  if (a.isRecurrent && b.isRecurrent) {
    const dayDiff = (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0);
    if (dayDiff !== 0) return dayDiff;
  } else {
    const dateDiff = (a.date ?? "").localeCompare(b.date ?? "");
    if (dateDiff !== 0) return dateDiff;
  }
  if (a.allDay !== b.allDay) {
    return a.allDay ? -1 : 1;
  }
  const startDiff = (a.startMinute ?? 0) - (b.startMinute ?? 0);
  if (startDiff !== 0) return startDiff;
  return (a.endMinute ?? 0) - (b.endMinute ?? 0);
}

export function expandRecurrentSlots(input: {
  daysOfWeek: readonly number[];
  allDay: boolean;
  startMinute: number | null;
  endMinute: number | null;
}): WorkdaySlotInput[] {
  const uniqueDays = [...new Set(input.daysOfWeek)].sort((a, b) => a - b);
  return uniqueDays.map((dayOfWeek) => ({
    isRecurrent: true,
    dayOfWeek,
    date: null,
    allDay: input.allDay,
    startMinute: input.allDay ? null : input.startMinute,
    endMinute: input.allDay ? null : input.endMinute,
  }));
}

export function expandDateRangeSlots(input: {
  startDate: string;
  endDate?: string;
  allDay: boolean;
  startMinute: number | null;
  endMinute: number | null;
}): WorkdaySlotInput[] {
  const start = toUtcDate(input.startDate);
  const end = toUtcDate(input.endDate?.trim() || input.startDate);
  const dayCount =
    Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  if (dayCount <= 0 || dayCount > MAX_DATE_RANGE_DAYS) {
    return [];
  }

  const slots: WorkdaySlotInput[] = [];
  for (let offset = 0; offset < dayCount; offset += 1) {
    const current = new Date(start.getTime() + offset * MS_PER_DAY);
    slots.push({
      isRecurrent: false,
      dayOfWeek: null,
      date: fromUtcDate(current),
      allDay: input.allDay,
      startMinute: input.allDay ? null : input.startMinute,
      endMinute: input.allDay ? null : input.endMinute,
    });
  }
  return slots;
}

export function mergeAndSortWorkdaySlots(
  existing: readonly WorkdaySlotInput[],
  added: readonly WorkdaySlotInput[],
): WorkdaySlotInput[] {
  const byKey = new Map<string, WorkdaySlotInput>();
  for (const slot of [...existing, ...added]) {
    byKey.set(slotIdentityKey(slot), slot);
  }
  return [...byKey.values()].sort(compareSlots);
}
