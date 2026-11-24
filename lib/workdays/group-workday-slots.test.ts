import { describe, expect, it } from "vitest";

import { groupWorkdaySlotsByWeekday } from "./group-workday-slots";

describe("groupWorkdaySlotsByWeekday", () => {
  it("shows every badge and groups five weekdays into five rows", () => {
    const groups = groupWorkdaySlotsByWeekday([
      {
        isRecurrent: true,
        dayOfWeek: 1,
        date: null,
        startMinute: 480,
        endMinute: 720,
      },
      {
        isRecurrent: true,
        dayOfWeek: 1,
        date: null,
        startMinute: 780,
        endMinute: 1020,
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
      {
        isRecurrent: true,
        dayOfWeek: 4,
        date: null,
        startMinute: 480,
        endMinute: 720,
      },
      {
        isRecurrent: true,
        dayOfWeek: 5,
        date: null,
        startMinute: 480,
        endMinute: 720,
      },
    ]);

    expect(groups).toHaveLength(5);
    expect(groups[0]).toEqual({
      weekday: 1,
      times: ["08:00–12:00", "13:00–17:00"],
    });
    expect(groups.map((group) => group.weekday)).toEqual([1, 2, 3, 4, 5]);
    expect(groups.flatMap((group) => group.times)).toHaveLength(6);
  });
});
