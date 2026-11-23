import { describe, expect, it } from "vitest";

import {
  allDayWeekSlots,
  expandDateRangeSlots,
  expandRecurrentSlots,
  mergeAndSortWorkdaySlots,
} from "./workday-slot-helpers";

describe("allDayWeekSlots", () => {
  it("covers every weekday as an all-day recurrent slot", () => {
    const slots = allDayWeekSlots();
    expect(slots).toHaveLength(7);
    expect(slots.every((slot) => slot.allDay && slot.isRecurrent)).toBe(true);
    expect(slots.map((slot) => slot.dayOfWeek)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe("expandRecurrentSlots", () => {
  it("creates one normalized slot per selected weekday", () => {
    const slots = expandRecurrentSlots({
      daysOfWeek: [3, 1, 1, 2],
      allDay: false,
      startMinute: 480,
      endMinute: 720,
    });
    expect(slots).toEqual([
      {
        isRecurrent: true,
        dayOfWeek: 1,
        date: null,
        allDay: false,
        startMinute: 480,
        endMinute: 720,
      },
      {
        isRecurrent: true,
        dayOfWeek: 2,
        date: null,
        allDay: false,
        startMinute: 480,
        endMinute: 720,
      },
      {
        isRecurrent: true,
        dayOfWeek: 3,
        date: null,
        allDay: false,
        startMinute: 480,
        endMinute: 720,
      },
    ]);
  });

  it("nulls start/end minutes when allDay is true", () => {
    const slots = expandRecurrentSlots({
      daysOfWeek: [0],
      allDay: true,
      startMinute: 480,
      endMinute: 720,
    });
    expect(slots[0]).toMatchObject({
      dayOfWeek: 0,
      allDay: true,
      startMinute: null,
      endMinute: null,
    });
  });
});

describe("expandDateRangeSlots", () => {
  it("expands a single date when endDate is empty", () => {
    const slots = expandDateRangeSlots({
      startDate: "2026-11-20",
      endDate: "",
      allDay: true,
      startMinute: null,
      endMinute: null,
    });
    expect(slots).toEqual([
      {
        isRecurrent: false,
        dayOfWeek: null,
        date: "2026-11-20",
        allDay: true,
        startMinute: null,
        endMinute: null,
      },
    ]);
  });

  it("expands inclusive multi-day ranges across month boundary", () => {
    const slots = expandDateRangeSlots({
      startDate: "2026-11-29",
      endDate: "2026-12-02",
      allDay: false,
      startMinute: 480,
      endMinute: 1020,
    });
    expect(slots.map((slot) => slot.date)).toEqual([
      "2026-11-29",
      "2026-11-30",
      "2026-12-01",
      "2026-12-02",
    ]);
  });
});

describe("mergeAndSortWorkdaySlots", () => {
  it("deduplicates identical slots and orders recurrent before specific dates", () => {
    const merged = mergeAndSortWorkdaySlots(
      [
        {
          isRecurrent: false,
          dayOfWeek: null,
          date: "2026-11-20",
          allDay: true,
          startMinute: null,
          endMinute: null,
        },
      ],
      [
        {
          isRecurrent: true,
          dayOfWeek: 1,
          date: null,
          allDay: false,
          startMinute: 780,
          endMinute: 1020,
        },
        {
          isRecurrent: true,
          dayOfWeek: 1,
          date: null,
          allDay: false,
          startMinute: 480,
          endMinute: 720,
        },
        {
          isRecurrent: false,
          dayOfWeek: null,
          date: "2026-11-20",
          allDay: true,
          startMinute: null,
          endMinute: null,
        },
      ],
    );

    expect(merged).toHaveLength(3);
    expect(merged[0]).toMatchObject({ isRecurrent: true, startMinute: 480 });
    expect(merged[1]).toMatchObject({ isRecurrent: true, startMinute: 780 });
    expect(merged[2]).toMatchObject({ isRecurrent: false, date: "2026-11-20" });
  });
});
