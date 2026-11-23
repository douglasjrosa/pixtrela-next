import { createWorkday } from "@/lib/repos/workdays";
import { allDayWeekSlots } from "@/lib/workdays/workday-slot-helpers";

/** All-day global work rule so duration credits match wall clock in tests. */
export async function createGlobalAllDayWorkday(suffix: string) {
  return createWorkday({
    name: `All-day ${suffix}`,
    description: null,
    action: "work",
    scope: "global",
    timezone: "UTC",
    validFrom: null,
    validUntil: null,
    teamIds: [],
    userIds: [],
    slots: allDayWeekSlots(),
  });
}
