import { describe, expect, it } from "vitest";

import {
  groupCapacity,
  planGroupCloseActivities,
} from "@/lib/business/group-session";

describe("groupCapacity", () => {
  it("uses the highest member capacity", () => {
    expect(groupCapacity([1, 3, 2])).toBe(3);
  });
});

describe("planGroupCloseActivities", () => {
  it("records sequential windows from the real wall clock", () => {
    const startedAt = new Date("2026-09-26T16:00:00.000Z");
    const endedAt = new Date("2026-09-26T16:03:00.000Z");
    const planned = planGroupCloseActivities({
      runStartedAt: startedAt,
      endedAt,
      members: [
        { documentId: "cut", expectedTime: 60 },
        { documentId: "pack", expectedTime: 30 },
      ],
      presences: [
        { userId: "ana", joinedAt: startedAt, leftAt: null },
      ],
    });

    expect(planned).toEqual([
      {
        subTaskId: "cut",
        colaboratorId: "ana",
        startedAt,
        stoppedAt: new Date("2026-09-26T16:02:00.000Z"),
        timeSpentSeconds: 120,
      },
      {
        subTaskId: "pack",
        colaboratorId: "ana",
        startedAt: new Date("2026-09-26T16:02:00.000Z"),
        stoppedAt: endedAt,
        timeSpentSeconds: 60,
      },
    ]);
  });

  it("splits a segment by each worker's presence", () => {
    const startedAt = new Date("2026-09-26T16:00:00.000Z");
    const endedAt = new Date("2026-09-26T16:02:00.000Z");
    const planned = planGroupCloseActivities({
      runStartedAt: startedAt,
      endedAt,
      members: [{ documentId: "cut", expectedTime: 60 }],
      presences: [
        { userId: "ana", joinedAt: startedAt, leftAt: null },
        {
          userId: "bob",
          joinedAt: new Date("2026-09-26T16:01:00.000Z"),
          leftAt: null,
        },
      ],
    });
    const ana = planned.find((row) => row.colaboratorId === "ana");
    const bob = planned.find((row) => row.colaboratorId === "bob");
    expect(ana?.timeSpentSeconds).toBe(80);
    expect(bob?.timeSpentSeconds).toBe(40);
  });
});
