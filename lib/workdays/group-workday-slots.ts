import { formatMinutesToTime } from "@/lib/schemas/workday";

import { weekdayOfSlot } from "./workday-slot-helpers";

export type WorkdaySlotBadgeGroup = {
  weekday: number;
  times: string[];
};

type SlotLike = {
  isRecurrent: boolean;
  dayOfWeek: number | null;
  date: string | null;
  startMinute: number;
  endMinute: number;
};

export function formatWorkdaySlotTime(slot: SlotLike): string {
  const start = formatMinutesToTime(slot.startMinute);
  const end = formatMinutesToTime(slot.endMinute);
  return `${start}–${end}`;
}

export function groupWorkdaySlotsByWeekday(
  slots: readonly SlotLike[],
): WorkdaySlotBadgeGroup[] {
  const grouped = new Map<number, string[]>();
  for (const slot of slots) {
    const weekday = weekdayOfSlot(slot);
    const list = grouped.get(weekday) ?? [];
    list.push(formatWorkdaySlotTime(slot));
    grouped.set(weekday, list);
  }
  return [...grouped.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([weekday, times]) => ({ weekday, times }));
}
