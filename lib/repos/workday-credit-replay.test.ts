import { describe, expect, it } from "vitest";

import { workdayReplayRange } from "./workday-credit-replay";

describe("workdayReplayRange", () => {
  it("pads dated slots by one UTC day on each side", () => {
    const range = workdayReplayRange({
      validFrom: null,
      validUntil: null,
      slots: [
        {
          id: "s1",
          workdayId: "w1",
          isRecurrent: false,
          dayOfWeek: null,
          date: "2026-11-20",
          startMinute: 0,
          endMinute: 1440,
        },
      ],
    });
    expect(range.from.toISOString().startsWith("2026-11-19")).toBe(true);
    expect(range.to.toISOString().startsWith("2026-11-21")).toBe(true);
  });
});
