import { describe, expect, it } from "vitest";

import {
  DEFAULT_WORKDAY_TIMEZONE,
  formatMinutesToTime,
  normalizeWorkdayFormValues,
  parseTimeToMinutes,
  workdayFormSchema,
  workdaySlotInputSchema,
} from "./workday";

const TEAM_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

const VALID_RECURRENT_SLOT = {
  isRecurrent: true,
  dayOfWeek: 1,
  date: null,
  startMinute: 480,
  endMinute: 720,
};

const CIVIL_DAY_SLOT = {
  isRecurrent: false,
  dayOfWeek: null,
  date: "2026-11-20",
  startMinute: 0,
  endMinute: 1440,
};

describe("time helpers", () => {
  it("parses HH:mm including 24:00", () => {
    expect(parseTimeToMinutes("00:00")).toBe(0);
    expect(parseTimeToMinutes("08:30")).toBe(510);
    expect(parseTimeToMinutes("24:00")).toBe(1440);
    expect(parseTimeToMinutes("24:01")).toBeNull();
    expect(parseTimeToMinutes("25:00")).toBeNull();
    expect(parseTimeToMinutes("bad")).toBeNull();
  });

  it("formats minutes to HH:mm", () => {
    expect(formatMinutesToTime(0)).toBe("00:00");
    expect(formatMinutesToTime(510)).toBe("08:30");
    expect(formatMinutesToTime(1440)).toBe("24:00");
  });
});

describe("workdaySlotInputSchema", () => {
  it("accepts a recurrent timed slot", () => {
    const parsed = workdaySlotInputSchema.parse(VALID_RECURRENT_SLOT);
    expect(parsed.dayOfWeek).toBe(1);
    expect(parsed.date).toBeNull();
  });

  it("accepts a specific-date civil-day slot", () => {
    const parsed = workdaySlotInputSchema.parse(CIVIL_DAY_SLOT);
    expect(parsed.startMinute).toBe(0);
    expect(parsed.endMinute).toBe(1440);
    expect(parsed.date).toBe("2026-11-20");
  });

  it("rejects endMinute <= startMinute", () => {
    const res = workdaySlotInputSchema.safeParse({
      ...VALID_RECURRENT_SLOT,
      startMinute: 720,
      endMinute: 720,
    });
    expect(res.success).toBe(false);
  });

  it("rejects recurrent slot without dayOfWeek or with date", () => {
    expect(
      workdaySlotInputSchema.safeParse({
        ...VALID_RECURRENT_SLOT,
        dayOfWeek: null,
      }).success,
    ).toBe(false);
    expect(
      workdaySlotInputSchema.safeParse({
        ...VALID_RECURRENT_SLOT,
        date: "2026-11-20",
      }).success,
    ).toBe(false);
  });

  it("rejects non-recurrent slot without date or with dayOfWeek", () => {
    expect(
      workdaySlotInputSchema.safeParse({
        isRecurrent: false,
        dayOfWeek: null,
        date: null,
        startMinute: 0,
        endMinute: 1440,
      }).success,
    ).toBe(false);
    expect(
      workdaySlotInputSchema.safeParse({
        isRecurrent: false,
        dayOfWeek: 2,
        date: "2026-11-20",
        startMinute: 0,
        endMinute: 1440,
      }).success,
    ).toBe(false);
  });
});

const BASE_FORM = {
  description: "",
  action: "work" as const,
  scope: "global" as const,
  timezone: DEFAULT_WORKDAY_TIMEZONE,
  validFrom: "",
  validUntil: "",
  teamIds: [] as string[],
  userIds: [] as string[],
  slots: [VALID_RECURRENT_SLOT],
};

describe("workdayFormSchema", () => {
  it("accepts and normalizes a global work scale", () => {
    const parsed = normalizeWorkdayFormValues(
      workdayFormSchema.parse(BASE_FORM),
    );
    expect(parsed.action).toBe("work");
    expect(parsed.scope).toBe("global");
    expect(parsed.timezone).toBe(DEFAULT_WORKDAY_TIMEZONE);
    expect(parsed.description).toBeNull();
    expect(parsed.teamIds).toEqual([]);
    expect(parsed.userIds).toEqual([]);
  });

  it("requires teamIds when scope is team and clears userIds", () => {
    expect(
      workdayFormSchema.safeParse({
        ...BASE_FORM,
        scope: "team",
        teamIds: [],
      }).success,
    ).toBe(false);

    const parsed = normalizeWorkdayFormValues(
      workdayFormSchema.parse({
        ...BASE_FORM,
        scope: "team",
        teamIds: [TEAM_ID],
        userIds: [USER_ID],
      }),
    );
    expect(parsed.teamIds).toEqual([TEAM_ID]);
    expect(parsed.userIds).toEqual([]);
  });

  it("requires userIds when scope is user and clears teamIds", () => {
    expect(
      workdayFormSchema.safeParse({
        ...BASE_FORM,
        action: "off",
        scope: "user",
        userIds: [],
        slots: [
          {
            isRecurrent: false,
            dayOfWeek: null,
            date: "2026-11-24",
            startMinute: 480,
            endMinute: 720,
          },
        ],
      }).success,
    ).toBe(false);

    const parsed = normalizeWorkdayFormValues(
      workdayFormSchema.parse({
        ...BASE_FORM,
        action: "off",
        scope: "user",
        teamIds: [TEAM_ID],
        userIds: [USER_ID],
        validFrom: "",
        validUntil: "",
        slots: [
          {
            isRecurrent: false,
            dayOfWeek: null,
            date: "2026-11-24",
            startMinute: 480,
            endMinute: 720,
          },
        ],
      }),
    );
    expect(parsed.userIds).toEqual([USER_ID]);
    expect(parsed.teamIds).toEqual([]);
  });

  it("rejects validUntil earlier than validFrom", () => {
    const res = workdayFormSchema.safeParse({
      ...BASE_FORM,
      validFrom: "2026-12-10",
      validUntil: "2026-12-01",
    });
    expect(res.success).toBe(false);
  });

  it("requires at least one slot", () => {
    const res = workdayFormSchema.safeParse({
      ...BASE_FORM,
      slots: [],
    });
    expect(res.success).toBe(false);
  });

  it("requires a civil-day holiday to be global with 00:00-24:00", () => {
    expect(
      workdayFormSchema.safeParse({
        ...BASE_FORM,
        action: "holiday",
        scope: "user",
        userIds: [USER_ID],
        slots: [CIVIL_DAY_SLOT],
      }).success,
    ).toBe(false);

    const parsed = workdayFormSchema.parse({
      ...BASE_FORM,
      action: "holiday",
      scope: "global",
      slots: [CIVIL_DAY_SLOT],
    });
    expect(parsed.slots[0]?.startMinute).toBe(0);
    expect(parsed.slots[0]?.endMinute).toBe(1440);
  });

  it("requires a 15-character description for excused absence", () => {
    expect(
      workdayFormSchema.safeParse({
        ...BASE_FORM,
        action: "excused_absence",
        scope: "user",
        userIds: [USER_ID],
        description: "curto demais",
        slots: [CIVIL_DAY_SLOT],
      }).success,
    ).toBe(false);

    expect(
      workdayFormSchema.safeParse({
        ...BASE_FORM,
        action: "excused_absence",
        scope: "user",
        userIds: [USER_ID],
        description: "Atestado entregue na portaria.",
        slots: [CIVIL_DAY_SLOT],
      }).success,
    ).toBe(true);
  });
});
