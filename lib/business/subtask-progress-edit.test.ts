import { describe, expect, it } from "vitest";

import { applySubTaskProgressForRole } from "./subtask-progress-edit";

const incoming = {
  name: "Soldar",
  qty: 1,
  expectedTime: 60,
  sharingType: "duration" as const,
  maxSameTimeWorkers: 1,
  status: "finished" as const,
  timeSpent: 90,
  activationStatus: "unlocked" as const,
  dependencyIds: [],
};

const current = { status: "waiting" as const, timeSpent: 12 };

describe("applySubTaskProgressForRole", () => {
  it("keeps incoming status and timeSpent for admin", () => {
    expect(applySubTaskProgressForRole(incoming, current, true)).toEqual({
      ...incoming,
      timeSpent: 90,
    });
  });

  it("uses stored timeSpent when admin omits it", () => {
    expect(
      applySubTaskProgressForRole(
        { ...incoming, timeSpent: undefined },
        current,
        true,
      ).timeSpent,
    ).toBe(12);
  });

  it("locks status and timeSpent for non-admin", () => {
    expect(applySubTaskProgressForRole(incoming, current, false)).toEqual({
      ...incoming,
      status: "waiting",
      timeSpent: 12,
    });
  });
});
