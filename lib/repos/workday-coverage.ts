import { and, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";

import {
  teamMembers,
  workdays,
  workdaySlots,
  workdayTeams,
  workdayUsers,
} from "@/drizzle/schema";
import { toCalendarDateKey } from "@/lib/business/datetime-timezone";
import { getDb, type Db } from "@/lib/db/client";
import {
  assignWorkdayRulesToUsers,
  createSessionSecondsMeasurer,
  type SessionSecondsMeasurer,
  type WorkdayCoverageRule,
  type WorkdayCoverageSlot,
  type WorkdayRuleAssignment,
} from "@/lib/domain/workday-coverage";

const ISO_DATE_LENGTH = 10;

function asIsoDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return toCalendarDateKey(value, "UTC");
  }
  const text = String(value).slice(0, ISO_DATE_LENGTH);
  return text.length === ISO_DATE_LENGTH ? text : null;
}

function toCoverageSlot(row: {
  isRecurrent: boolean;
  dayOfWeek: number | null;
  date: string | Date | null;
  allDay: boolean;
  startMinute: number | null;
  endMinute: number | null;
}): WorkdayCoverageSlot {
  return {
    isRecurrent: row.isRecurrent,
    dayOfWeek: row.dayOfWeek,
    date: asIsoDate(row.date),
    allDay: row.allDay,
    startMinute: row.startMinute,
    endMinute: row.endMinute,
  };
}

function paddedRange(from: Date, to: Date): { fromKey: string; toKey: string } {
  const fromKey = toCalendarDateKey(from, "UTC");
  const toKey = toCalendarDateKey(to, "UTC");
  const fromDate = new Date(`${fromKey}T00:00:00.000Z`);
  const toDate = new Date(`${toKey}T00:00:00.000Z`);
  fromDate.setUTCDate(fromDate.getUTCDate() - 1);
  toDate.setUTCDate(toDate.getUTCDate() + 1);
  return {
    fromKey: toCalendarDateKey(fromDate, "UTC"),
    toKey: toCalendarDateKey(toDate, "UTC"),
  };
}

export async function loadWorkdayRulesForUsers(
  input: {
    userIds: readonly string[];
    from: Date;
    to: Date;
  },
  db: Db = getDb(),
): Promise<Map<string, WorkdayCoverageRule[]>> {
  const userIds = [...new Set(input.userIds.filter(Boolean))];
  if (userIds.length === 0) return new Map();

  const memberships = await db
    .select({
      userId: teamMembers.userId,
      teamId: teamMembers.teamId,
    })
    .from(teamMembers)
    .where(inArray(teamMembers.userId, userIds));

  const teamIdsByUserId = new Map<string, string[]>();
  for (const row of memberships) {
    const list = teamIdsByUserId.get(row.userId) ?? [];
    list.push(row.teamId);
    teamIdsByUserId.set(row.userId, list);
  }

  const { fromKey, toKey } = paddedRange(input.from, input.to);
  const workdayRows = await db
    .select({
      id: workdays.id,
      action: workdays.action,
      scope: workdays.scope,
      timezone: workdays.timezone,
      validFrom: workdays.validFrom,
      validUntil: workdays.validUntil,
      active: workdays.active,
    })
    .from(workdays)
    .where(
      and(
        eq(workdays.active, true),
        or(isNull(workdays.validUntil), gte(workdays.validUntil, fromKey)),
        or(isNull(workdays.validFrom), lte(workdays.validFrom, toKey)),
      ),
    );

  if (workdayRows.length === 0) {
    return assignWorkdayRulesToUsers(userIds, teamIdsByUserId, []);
  }

  const workdayIds = workdayRows.map((row) => row.id);
  const [slotRows, teamRows, userRows] = await Promise.all([
    db
      .select({
        workdayId: workdaySlots.workdayId,
        isRecurrent: workdaySlots.isRecurrent,
        dayOfWeek: workdaySlots.dayOfWeek,
        date: workdaySlots.date,
        allDay: workdaySlots.allDay,
        startMinute: workdaySlots.startMinute,
        endMinute: workdaySlots.endMinute,
      })
      .from(workdaySlots)
      .where(inArray(workdaySlots.workdayId, workdayIds)),
    db
      .select({
        workdayId: workdayTeams.workdayId,
        teamId: workdayTeams.teamId,
      })
      .from(workdayTeams)
      .where(inArray(workdayTeams.workdayId, workdayIds)),
    db
      .select({
        workdayId: workdayUsers.workdayId,
        userId: workdayUsers.userId,
      })
      .from(workdayUsers)
      .where(inArray(workdayUsers.workdayId, workdayIds)),
  ]);

  const slotsByWorkday = new Map<string, WorkdayCoverageSlot[]>();
  for (const row of slotRows) {
    const list = slotsByWorkday.get(row.workdayId) ?? [];
    list.push(toCoverageSlot(row));
    slotsByWorkday.set(row.workdayId, list);
  }
  const teamIdsByWorkday = new Map<string, string[]>();
  for (const row of teamRows) {
    const list = teamIdsByWorkday.get(row.workdayId) ?? [];
    list.push(row.teamId);
    teamIdsByWorkday.set(row.workdayId, list);
  }
  const userIdsByWorkday = new Map<string, string[]>();
  for (const row of userRows) {
    const list = userIdsByWorkday.get(row.workdayId) ?? [];
    list.push(row.userId);
    userIdsByWorkday.set(row.workdayId, list);
  }

  const assignments: WorkdayRuleAssignment[] = workdayRows.map((row) => ({
    scope: row.scope,
    action: row.action,
    timezone: row.timezone,
    validFrom: asIsoDate(row.validFrom),
    validUntil: asIsoDate(row.validUntil),
    active: row.active,
    slots: slotsByWorkday.get(row.id) ?? [],
    teamIds: teamIdsByWorkday.get(row.id) ?? [],
    userIds: userIdsByWorkday.get(row.id) ?? [],
  }));

  return assignWorkdayRulesToUsers(userIds, teamIdsByUserId, assignments);
}

export async function loadSessionSecondsMeasurer(
  input: {
    userIds: readonly string[];
    from: Date;
    to: Date;
  },
  db: Db = getDb(),
): Promise<{
  measure: SessionSecondsMeasurer;
  rulesByUserId: Map<string, WorkdayCoverageRule[]>;
}> {
  const rulesByUserId = await loadWorkdayRulesForUsers(input, db);
  return {
    measure: createSessionSecondsMeasurer(rulesByUserId),
    rulesByUserId,
  };
}
