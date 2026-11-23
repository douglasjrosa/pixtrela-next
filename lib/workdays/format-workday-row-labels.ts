import type { WorkdayRow, WorkdaySlotRow } from "@/components/workdays/types";
import { formatDatePtBr } from "@/lib/format/datetime";
import { formatMinutesToTime } from "@/lib/schemas/workday";

export type WorkdayRowLabels = {
  actionLabel: string;
  scopeLabel: string;
  validityLabel: string;
  slotsSummary: string[];
  slotsCountLabel: string;
  inactiveLabel: string;
  selectRowLabel: string;
};

type WorkdaysTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

type CommonTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

const MAX_VISIBLE_SLOT_CHIPS = 4;

function weekdayShortLabel(dayOfWeek: number, t: WorkdaysTranslator): string {
  return t(`weekdayShort${dayOfWeek}`);
}

export function formatWorkdaySlotLabel(
  slot: WorkdaySlotRow,
  t: WorkdaysTranslator,
): string {
  const dayPart = slot.isRecurrent
    ? weekdayShortLabel(slot.dayOfWeek ?? 0, t)
    : formatDatePtBr(slot.date);
  if (slot.allDay) {
    return `${dayPart} · ${t("allDay")}`;
  }
  const start = formatMinutesToTime(slot.startMinute ?? 0);
  const end = formatMinutesToTime(slot.endMinute ?? 0);
  return `${dayPart} ${start}–${end}`;
}

export function formatWorkdayValidity(
  validFrom: string | null,
  validUntil: string | null,
  t: WorkdaysTranslator,
): string {
  const from = validFrom ? formatDatePtBr(validFrom) : "";
  const until = validUntil ? formatDatePtBr(validUntil) : "";
  if (from && until) return t("validityRange", { from, until });
  if (from) return t("validityFromOnly", { from });
  if (until) return t("validityUntilOnly", { until });
  return t("validityAlways");
}

function summarizeSlots(
  slots: readonly WorkdaySlotRow[],
  t: WorkdaysTranslator,
): string[] {
  const labels = slots.map((slot) => formatWorkdaySlotLabel(slot, t));
  if (labels.length <= MAX_VISIBLE_SLOT_CHIPS) return labels;
  const hiddenCount = labels.length - MAX_VISIBLE_SLOT_CHIPS;
  return [...labels.slice(0, MAX_VISIBLE_SLOT_CHIPS), `+${hiddenCount}`];
}

export function buildWorkdayRowLabels(
  workday: WorkdayRow,
  tWorkdays: WorkdaysTranslator,
  tCommon: CommonTranslator,
): WorkdayRowLabels {
  const actionLabel =
    workday.action === "work"
      ? tWorkdays("actionWork")
      : tWorkdays("actionOff");

  const scopeKey =
    workday.scope === "global"
      ? "scopeGlobal"
      : workday.scope === "team"
        ? "scopeTeam"
        : "scopeUser";

  return {
    actionLabel,
    scopeLabel: tWorkdays(scopeKey),
    validityLabel: formatWorkdayValidity(
      workday.validFrom,
      workday.validUntil,
      tWorkdays,
    ),
    slotsSummary: summarizeSlots(workday.slots, tWorkdays),
    slotsCountLabel: tWorkdays("slotsCount", { count: workday.slots.length }),
    inactiveLabel: tWorkdays("inactive"),
    selectRowLabel: tCommon("selectRow", { name: workday.name }),
  };
}
