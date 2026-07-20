import {
  labeledDateBadgeToneClassName,
  type LabeledDateBadgeTone,
} from "@/lib/ui/labeled-date-badge-tone";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export type KanbanDeliveryDateTone = LabeledDateBadgeTone;

function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Past calendar dates use danger; today and future dates use secondary. */
export function resolveKanbanDeliveryDateTone(
  deliveryDate: string | null | undefined,
  today: Date,
): KanbanDeliveryDateTone {
  if (!deliveryDate?.trim()) return "secondary";

  const parsed = parseDateOnly(deliveryDate);
  if (!parsed) return "secondary";

  return startOfDay(parsed) < startOfDay(today) ? "danger" : "secondary";
}

export function kanbanDeliveryDateBadgeClassName(
  tone: KanbanDeliveryDateTone,
): string {
  return labeledDateBadgeToneClassName(tone);
}
