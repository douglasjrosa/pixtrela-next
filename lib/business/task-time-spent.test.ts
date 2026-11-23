import { describe, expect, it } from "vitest";

import type { SessionSecondsMeasurer } from "@/lib/domain/workday-coverage";

import {
  calculateTimeSpentFromActivities,
  listTimeSpentByColaborator,
} from "./task-time-spent";

const T0 = new Date("2026-06-05T10:00:00.000Z");

function secondsLater(seconds: number): Date {
  return new Date(T0.getTime() + seconds * 1000);
}

const halfMeasure: SessionSecondsMeasurer = (startedAt, endedAt) => {
  const delta = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
  return Math.max(0, Math.floor(delta / 2));
};

describe("task time spent measurer", () => {
  const activities = [
    {
      colaboratorId: "ana",
      action: "started" as const,
      timestamp: T0,
    },
    {
      colaboratorId: "ana",
      action: "stoped" as const,
      timestamp: secondsLater(40),
    },
  ];

  it("defaults to wall-clock seconds", () => {
    expect(calculateTimeSpentFromActivities(activities, secondsLater(40))).toBe(
      40,
    );
  });

  it("uses the session measurer per colaborator", () => {
    expect(
      listTimeSpentByColaborator(activities, secondsLater(40), halfMeasure),
    ).toEqual([{ colaboratorId: "ana", timeSpentSeconds: 20 }]);
  });
});
