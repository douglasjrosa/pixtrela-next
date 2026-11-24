import { describe, expect, it } from "vitest";

import {
  civilDayWeekSlots,
  expandDateRangeSlots,
  expandRecurrentSlots,
  mergeAndSortWorkdaySlots,
  weekdayOfSlot,
} from "./workday-slot-helpers";

describe("civilDayWeekSlots", () => {
  it("covers every weekday as 00:00-24:00 recurrent slots", () => {
    const slots = civilDayWeekSlots();
    expect(slots).toHaveLength(7);
    expect(
      slots.every(
        (slot) =>
          slot.isRecurrent &&
          slot.startMinute === 0 &&
          slot.endMinute === 1440,
      ),
    ).toBe(true);
    expect(slots.map((slot) => slot.dayOfWeek)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe("expandRecurrentSlots", () => {
  it("creates one normalized slot per selected weekday", () => {
    const slots = expandRecurrentSlots({
      daysOfWeek: [3, 1, 1, 2],
      startMinute: 480,
      endMinute: 720,
    });
    expect(slots).toEqual([
      {
        isRecurrent: true,
        dayOfWeek: 1,
        date: null,
        startMinute: 480,
        endMinute: 720,
      },
      {
        isRecurrent: true,
        dayOfWeek: 2,
        date: null,
        startMinute: 480,
        endMinute: 720,
      },
      {
        isRecurrent: true,
        dayOfWeek: 3,
        date: null,
        startMinute: 480,
        endMinute: 720,
      },
    ]);
  });
});

describe("expandDateRangeSlots", () => {
  it("expands a single date when endDate is empty", () => {
    const slots = expandDateRangeSlots({
      startDate: "2026-11-20",
      endDate: "",
      startMinute: 0,
      endMinute: 1440,
    });
    expect(slots).toEqual([
      {
        isRecurrent: false,
        dayOfWeek: null,
        date: "2026-11-20",
        startMinute: 0,
        endMinute: 1440,
      },
    ]);
  });

  it("expands inclusive multi-day ranges across month boundary", () => {
    const slots = expandDateRangeSlots({
      startDate: "2026-11-29",
      endDate: "2026-12-02",
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
          startMinute: 0,
          endMinute: 1440,
        },
      ],
      [
        {
          isRecurrent: true,
          dayOfWeek: 1,
          date: null,
          startMinute: 780,
          endMinute: 1020,
        },
        {
          isRecurrent: true,
          dayOfWeek: 1,
          date: null,
          startMinute: 480,
          endMinute: 720,
        },
        {
          isRecurrent: false,
          dayOfWeek: null,
          date: "2026-11-20",
          startMinute: 0,
          endMinute: 1440,
        },
      ],
    );

    expect(merged).toHaveLength(3);
    expect(merged[0]).toMatchObject({ isRecurrent: true, startMinute: 480 });
    expect(merged[1]).toMatchObject({ isRecurrent: true, startMinute: 780 });
    expect(merged[2]).toMatchObject({ isRecurrent: false, date: "2026-11-20" });
  });
});

describe("weekdayOfSlot", () => {
  it("uses dayOfWeek for recurrent slots and UTC weekday for dates", () => {
    expect(
      weekdayOfSlot({ isRecurrent: true, dayOfWeek: 3, date: null }),
    ).toBe(3);
    expect(
      weekdayOfSlot({
        isRecurrent: false,
        dayOfWeek: null,
        date: "2026-11-20",
      }),
    ).toBe(5);
  });
});
