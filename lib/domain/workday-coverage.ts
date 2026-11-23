import { DEFAULT_WORKDAY_TIMEZONE } from "@/lib/schemas/workday";

function calendarDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const MS_PER_SECOND = 1000;
const MS_PER_DAY = 86_400_000;
const MINUTES_PER_HOUR = 60;
const MINUTE_END_OF_DAY = 1440;
const SCOPE_RANK = {
  user: 2,
  team: 1,
  global: 0,
} as const;

export const PRODUCTIVE_TIMER_HORIZON_DAYS = 7;

export type WorkdayCoverageSlot = {
  isRecurrent: boolean;
  dayOfWeek: number | null;
  date: string | null;
  allDay: boolean;
  startMinute: number | null;
  endMinute: number | null;
};

export type WorkdayCoverageRule = {
  scope: "global" | "team" | "user";
  action: "work" | "off";
  timezone: string;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  slots: WorkdayCoverageSlot[];
};

export type WorkdayRuleAssignment = WorkdayCoverageRule & {
  teamIds: string[];
  userIds: string[];
};

export type ProductiveWindow = {
  startMs: number;
  endMs: number;
};

export type ProductiveWindowDto = {
  start: string;
  end: string;
};

export type SessionSecondsMeasurer = (
  startedAt: Date,
  endedAt: Date,
  colaboratorId: string,
) => number;

type CoveringInterval = {
  startMs: number;
  endMs: number;
  scopeRank: number;
  datedRank: number;
  offRank: number;
  action: "work" | "off";
};

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function dateTimeFormat(timeZone: string): Intl.DateTimeFormat {
  const cached = dtfCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  dtfCache.set(timeZone, formatter);
  return formatter;
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    dateTimeFormat(timeZone)
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - instant.getTime();
}

function zonedLocalToUtcMs(
  year: number,
  month: number,
  day: number,
  minuteOfDay: number,
  timeZone: string,
): number {
  const extraDays = Math.floor(minuteOfDay / MINUTE_END_OF_DAY);
  const minuteInDay = minuteOfDay - extraDays * MINUTE_END_OF_DAY;
  const hours = Math.floor(minuteInDay / MINUTES_PER_HOUR);
  const minutes = minuteInDay % MINUTES_PER_HOUR;
  const local = new Date(
    Date.UTC(year, month - 1, day + extraDays, hours, minutes, 0),
  );
  const guess = local.getTime();
  try {
    const firstOffset = timeZoneOffsetMs(new Date(guess), timeZone);
    const utc = guess - firstOffset;
    const secondOffset = timeZoneOffsetMs(new Date(utc), timeZone);
    if (secondOffset !== firstOffset) return guess - secondOffset;
    return utc;
  } catch {
    return guess;
  }
}

function parseIsoDate(
  isoDate: string,
): { year: number; month: number; day: number } {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year, month, day };
}

function formatIsoDateUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addIsoDays(isoDate: string, days: number): string {
  const { year, month, day } = parseIsoDate(isoDate);
  return formatIsoDateUtc(new Date(Date.UTC(year, month - 1, day + days)));
}

function weekdayFromIsoDate(isoDate: string): number {
  const { year, month, day } = parseIsoDate(isoDate);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function isIsoDateInValidity(
  isoDate: string,
  validFrom: string | null,
  validUntil: string | null,
): boolean {
  if (validFrom && isoDate < validFrom) return false;
  if (validUntil && isoDate > validUntil) return false;
  return true;
}

function slotMinutes(slot: WorkdayCoverageSlot): { start: number; end: number } {
  if (slot.allDay) return { start: 0, end: MINUTE_END_OF_DAY };
  return {
    start: Math.max(0, slot.startMinute ?? 0),
    end: Math.min(MINUTE_END_OF_DAY, slot.endMinute ?? 0),
  };
}

function slotMatchesLocalDate(slot: WorkdayCoverageSlot, isoDate: string): boolean {
  if (slot.isRecurrent) {
    return slot.dayOfWeek === weekdayFromIsoDate(isoDate);
  }
  return slot.date === isoDate;
}

function coveringIntervalsForRule(
  rule: WorkdayCoverageRule,
  startedAt: Date,
  endedAt: Date,
): CoveringInterval[] {
  if (!rule.active) return [];
  const timeZone = rule.timezone.trim() || DEFAULT_WORKDAY_TIMEZONE;
  const startKey = addIsoDays(calendarDateKey(startedAt, timeZone), -1);
  const endKey = addIsoDays(calendarDateKey(endedAt, timeZone), 1);
  const intervals: CoveringInterval[] = [];
  const scopeRank = SCOPE_RANK[rule.scope];
  const offRank = rule.action === "off" ? 1 : 0;

  for (
    let isoDate = startKey;
    isoDate <= endKey;
    isoDate = addIsoDays(isoDate, 1)
  ) {
    if (!isIsoDateInValidity(isoDate, rule.validFrom, rule.validUntil)) {
      continue;
    }
    const { year, month, day } = parseIsoDate(isoDate);
    for (const slot of rule.slots) {
      if (!slotMatchesLocalDate(slot, isoDate)) continue;
      const minutes = slotMinutes(slot);
      if (minutes.end <= minutes.start) continue;
      const startMs = zonedLocalToUtcMs(
        year,
        month,
        day,
        minutes.start,
        timeZone,
      );
      const endMs = zonedLocalToUtcMs(year, month, day, minutes.end, timeZone);
      if (endMs <= startMs) continue;
      intervals.push({
        startMs,
        endMs,
        scopeRank,
        datedRank: slot.isRecurrent ? 0 : 1,
        offRank,
        action: rule.action,
      });
    }
  }
  return intervals;
}

function compareCover(left: CoveringInterval, right: CoveringInterval): number {
  if (left.scopeRank !== right.scopeRank) return right.scopeRank - left.scopeRank;
  if (left.datedRank !== right.datedRank) return right.datedRank - left.datedRank;
  return right.offRank - left.offRank;
}

function winnerAt(
  instantMs: number,
  intervals: readonly CoveringInterval[],
): CoveringInterval | null {
  let winner: CoveringInterval | null = null;
  for (const interval of intervals) {
    if (instantMs < interval.startMs || instantMs >= interval.endMs) continue;
    if (!winner || compareCover(interval, winner) < 0) {
      winner = interval;
    }
  }
  return winner;
}

function mergeWindows(windows: ProductiveWindow[]): ProductiveWindow[] {
  if (windows.length === 0) return [];
  const sorted = [...windows].sort(
    (left, right) => left.startMs - right.startMs,
  );
  const merged: ProductiveWindow[] = [];
  for (const window of sorted) {
    const last = merged[merged.length - 1];
    if (!last || window.startMs > last.endMs) {
      merged.push({ ...window });
      continue;
    }
    last.endMs = Math.max(last.endMs, window.endMs);
  }
  return merged;
}

function sweepWorkWindows(
  startedAt: Date,
  endedAt: Date,
  rules: readonly WorkdayCoverageRule[],
): ProductiveWindow[] {
  const startMs = startedAt.getTime();
  const endMs = endedAt.getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return [];
  }

  const intervals = rules.flatMap((rule) =>
    coveringIntervalsForRule(rule, startedAt, endedAt),
  );
  const bounds = new Set<number>([startMs, endMs]);
  for (const interval of intervals) {
    if (interval.endMs <= startMs || interval.startMs >= endMs) continue;
    bounds.add(Math.max(startMs, interval.startMs));
    bounds.add(Math.min(endMs, interval.endMs));
  }
  const points = [...bounds].sort((left, right) => left - right);
  const windows: ProductiveWindow[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const sliceStart = points[index]!;
    const sliceEnd = points[index + 1]!;
    if (sliceEnd <= sliceStart) continue;
    const winner = winnerAt((sliceStart + sliceEnd) / 2, intervals);
    if (!winner || winner.action !== "work") continue;
    windows.push({ startMs: sliceStart, endMs: sliceEnd });
  }

  return mergeWindows(windows);
}

export function resolveProductiveWindows(
  startedAt: Date,
  endedAt: Date,
  rules: readonly WorkdayCoverageRule[],
): ProductiveWindow[] {
  return sweepWorkWindows(startedAt, endedAt, rules);
}

export function productiveSecondsFromWindows(
  startedAtMs: number,
  endedAtMs: number,
  windows: readonly ProductiveWindow[],
): number {
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(endedAtMs)) return 0;
  if (endedAtMs <= startedAtMs) return 0;
  let totalMs = 0;
  for (const window of windows) {
    const start = Math.max(startedAtMs, window.startMs);
    const end = Math.min(endedAtMs, window.endMs);
    if (end > start) totalMs += end - start;
  }
  return Math.floor(totalMs / MS_PER_SECOND);
}

export function productiveSecondsBetween(
  startedAt: Date,
  endedAt: Date,
  rules: readonly WorkdayCoverageRule[],
): number {
  return productiveSecondsFromWindows(
    startedAt.getTime(),
    endedAt.getTime(),
    resolveProductiveWindows(startedAt, endedAt, rules),
  );
}

export function unionProductiveSeconds(input: {
  startedAt: Date;
  endedAt: Date;
  participants: readonly {
    from: Date;
    to: Date;
    rules: readonly WorkdayCoverageRule[];
  }[];
}): number {
  const windows = input.participants.flatMap((participant) => {
    const fromMs = Math.max(
      input.startedAt.getTime(),
      participant.from.getTime(),
    );
    const toMs = Math.min(input.endedAt.getTime(), participant.to.getTime());
    if (toMs <= fromMs) return [];
    return resolveProductiveWindows(
      new Date(fromMs),
      new Date(toMs),
      participant.rules,
    );
  });
  return productiveSecondsFromWindows(
    input.startedAt.getTime(),
    input.endedAt.getTime(),
    mergeWindows(windows),
  );
}

export function createSessionSecondsMeasurer(
  rulesByUserId: ReadonlyMap<string, readonly WorkdayCoverageRule[]>,
): SessionSecondsMeasurer {
  return (startedAt, endedAt, colaboratorId) =>
    productiveSecondsBetween(
      startedAt,
      endedAt,
      rulesByUserId.get(colaboratorId) ?? [],
    );
}

function withoutTargets(workday: WorkdayRuleAssignment): WorkdayCoverageRule {
  return {
    scope: workday.scope,
    action: workday.action,
    timezone: workday.timezone,
    validFrom: workday.validFrom,
    validUntil: workday.validUntil,
    active: workday.active,
    slots: workday.slots,
  };
}

export function assignWorkdayRulesToUsers(
  userIds: readonly string[],
  teamIdsByUserId: ReadonlyMap<string, readonly string[]>,
  workdays: readonly WorkdayRuleAssignment[],
): Map<string, WorkdayCoverageRule[]> {
  const assigned = new Map<string, WorkdayCoverageRule[]>();
  for (const userId of userIds) {
    const teamIds = new Set(teamIdsByUserId.get(userId) ?? []);
    const rules: WorkdayCoverageRule[] = [];
    for (const workday of workdays) {
      if (!workday.active) continue;
      const matchesGlobal = workday.scope === "global";
      const matchesUser =
        workday.scope === "user" && workday.userIds.includes(userId);
      const matchesTeam =
        workday.scope === "team" &&
        workday.teamIds.some((teamId) => teamIds.has(teamId));
      if (!matchesGlobal && !matchesUser && !matchesTeam) continue;
      rules.push(withoutTargets(workday));
    }
    assigned.set(userId, rules);
  }
  return assigned;
}

export function toProductiveWindowDtos(
  windows: readonly ProductiveWindow[],
): ProductiveWindowDto[] {
  return windows.map((window) => ({
    start: new Date(window.startMs).toISOString(),
    end: new Date(window.endMs).toISOString(),
  }));
}

export function fromProductiveWindowDtos(
  dtos: readonly ProductiveWindowDto[],
): ProductiveWindow[] {
  return dtos
    .map((dto) => ({
      startMs: Date.parse(dto.start),
      endMs: Date.parse(dto.end),
    }))
    .filter(
      (window) =>
        Number.isFinite(window.startMs) &&
        Number.isFinite(window.endMs) &&
        window.endMs > window.startMs,
    );
}

export function timerHorizonEnd(now: Date): Date {
  return new Date(
    now.getTime() + PRODUCTIVE_TIMER_HORIZON_DAYS * MS_PER_DAY,
  );
}

export function collectSessionMeasureRange(
  rows: readonly { colaboratorId: string; timestamp: Date }[],
  fallback: Date,
): { userIds: string[]; from: Date; to: Date } {
  const userIds = new Set<string>();
  let from = fallback;
  let to = fallback;
  for (const row of rows) {
    userIds.add(row.colaboratorId);
    if (row.timestamp < from) from = row.timestamp;
    if (row.timestamp > to) to = row.timestamp;
  }
  return { userIds: [...userIds], from, to };
}
