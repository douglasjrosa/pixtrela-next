import type { WorkdayAction } from "@/lib/domain/workday-actions";

export const WORKDAY_ACTION_MESSAGE_KEYS: Record<WorkdayAction, string> = {
  absence: "actionAbsence",
  excused_absence: "actionExcusedAbsence",
  partial_absence: "actionPartialAbsence",
  partial_excused_absence: "actionPartialExcusedAbsence",
  off: "actionOff",
  holiday: "actionHoliday",
  work: "actionWork",
  overtime: "actionOvertime",
  make_up: "actionMakeUp",
};
