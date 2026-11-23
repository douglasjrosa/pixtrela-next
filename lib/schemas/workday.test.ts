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
  allDay: false,
  startMinute: 480,
  endMinute: 720,
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

  it("accepts a specific-date all-day slot", () => {
    const parsed = workdaySlotInputSchema.parse({
      isRecurrent: false,
      dayOfWeek: null,
      date: "2026-11-20",
      allDay: true,
      startMinute: null,
      endMinute: null,
    });
    expect(parsed.allDay).toBe(true);
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
        allDay: true,
        startMinute: null,
        endMinute: null,
      }).success,
    ).toBe(false);
    expect(
      workdaySlotInputSchema.safeParse({
        isRecurrent: false,
        dayOfWeek: 2,
        date: "2026-11-20",
        allDay: true,
        startMinute: null,
        endMinute: null,
      }).success,
    ).toBe(false);
  });
});

const BASE_FORM = {
  name: "Expediente padrão",
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
  it("accepts and normalizes a global workday", () => {
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
        name: "Turno A",
        scope: "team",
        teamIds: [],
      }).success,
    ).toBe(false);

    const parsed = normalizeWorkdayFormValues(
      workdayFormSchema.parse({
        ...BASE_FORM,
        name: "Turno A",
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
        name: "Folga João",
        action: "off",
        scope: "user",
        userIds: [],
      }).success,
    ).toBe(false);

    const parsed = normalizeWorkdayFormValues(
      workdayFormSchema.parse({
        ...BASE_FORM,
        name: "Folga João",
        action: "off",
        scope: "user",
        teamIds: [TEAM_ID],
        userIds: [USER_ID],
      }),
    );
    expect(parsed.userIds).toEqual([USER_ID]);
    expect(parsed.teamIds).toEqual([]);
  });

  it("rejects validUntil earlier than validFrom", () => {
    const res = workdayFormSchema.safeParse({
      ...BASE_FORM,
      name: "Verão",
      validFrom: "2026-12-10",
      validUntil: "2026-12-01",
    });
    expect(res.success).toBe(false);
  });

  it("requires at least one slot", () => {
    const res = workdayFormSchema.safeParse({
      ...BASE_FORM,
      name: "Sem horários",
      slots: [],
    });
    expect(res.success).toBe(false);
  });
});
