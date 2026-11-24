import type { WorkdayRow, WorkdaySlotRow } from "@/components/workdays/types";
import { formatDatePtBr } from "@/lib/format/datetime";
import { formatMinutesToTime } from "@/lib/schemas/workday";
import { groupWorkdaySlotsByWeekday } from "@/lib/workdays/group-workday-slots";
import { WORKDAY_ACTION_MESSAGE_KEYS } from "@/lib/workdays/workday-action-labels";

export type WorkdaySlotBadgeGroupLabel = {
  weekday: number;
  weekdayLabel: string;
  times: string[];
};

export type WorkdayRowLabels = {
  actionLabel: string;
  scopeLabel: string;
  validityLabel: string;
  slotGroups: WorkdaySlotBadgeGroupLabel[];
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
  const start = formatMinutesToTime(slot.startMinute);
  const end = formatMinutesToTime(slot.endMinute);
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

function datedValidityLabel(workday: WorkdayRow, t: WorkdaysTranslator): string {
  const dated = workday.slots.find((slot) => slot.date);
  if (dated?.date) return formatDatePtBr(dated.date);
  return formatWorkdayValidity(workday.validFrom, workday.validUntil, t);
}

export function buildWorkdayRowLabels(
  workday: WorkdayRow,
  tWorkdays: WorkdaysTranslator,
  tCommon: CommonTranslator,
): WorkdayRowLabels {
  const actionLabel = tWorkdays(WORKDAY_ACTION_MESSAGE_KEYS[workday.action]);
  const scopeKey =
    workday.scope === "global"
      ? "scopeGlobal"
      : workday.scope === "team"
        ? "scopeTeam"
        : "scopeUser";
  const targetName =
    workday.users[0]?.name ?? workday.teams[0]?.name ?? actionLabel;
  const slotGroups = groupWorkdaySlotsByWeekday(workday.slots).map((group) => ({
    weekday: group.weekday,
    weekdayLabel: weekdayShortLabel(group.weekday, tWorkdays),
    times: group.times,
  }));

  return {
    actionLabel,
    scopeLabel: tWorkdays(scopeKey),
    validityLabel: datedValidityLabel(workday, tWorkdays),
    slotGroups,
    slotsCountLabel: tWorkdays("slotsCount", { count: workday.slots.length }),
    inactiveLabel: tWorkdays("inactive"),
    selectRowLabel: tCommon("selectRow", { name: targetName }),
  };
}
