import { createWorkday } from "@/lib/repos/workdays";
import { civilDayWeekSlots } from "@/lib/workdays/workday-slot-helpers";

/** Civil-day global work rule so duration credits match wall clock in tests. */
export async function createGlobalAllDayWorkday() {
  return createWorkday({
    description: null,
    action: "work",
    scope: "global",
    timezone: "UTC",
    validFrom: null,
    validUntil: null,
    teamIds: [],
    userIds: [],
    slots: civilDayWeekSlots(),
  });
}
