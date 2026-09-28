import { describe, expect, it } from "vitest";

import { canStaffOpenQueue, isQueueProfileRole } from "./queue-open-access";

const colaborator = {
  id: "c1",
  role: "colaborator",
  active: true,
  blocked: false,
};

const leader = {
  id: "lead-1",
  role: "leader",
  active: true,
  blocked: false,
};

describe("canStaffOpenQueue", () => {
  it("lets manager+ open any active colaborator", () => {
    expect(
      canStaffOpenQueue({
        actorRole: "manager",
        actorId: "mgr-1",
        target: colaborator,
        leaderTeamColaboratorIds: new Set(),
      }),
    ).toBe(true);
    expect(
      canStaffOpenQueue({
        actorRole: "admin",
        actorId: "admin-1",
        target: colaborator,
        leaderTeamColaboratorIds: new Set(),
      }),
    ).toBe(true);
  });

  it("lets manager+ open a leader production queue", () => {
    expect(
      canStaffOpenQueue({
        actorRole: "manager",
        actorId: "mgr-1",
        target: leader,
        leaderTeamColaboratorIds: new Set(),
      }),
    ).toBe(true);
    expect(
      canStaffOpenQueue({
        actorRole: "admin",
        actorId: "admin-1",
        target: leader,
        leaderTeamColaboratorIds: new Set(),
      }),
    ).toBe(true);
  });

  it("lets staff open their own queue", () => {
    expect(
      canStaffOpenQueue({
        actorRole: "leader",
        actorId: "lead-1",
        target: leader,
        leaderTeamColaboratorIds: new Set(),
      }),
    ).toBe(true);
    expect(
      canStaffOpenQueue({
        actorRole: "manager",
        actorId: "mgr-1",
        target: { ...leader, id: "mgr-1", role: "manager" },
        leaderTeamColaboratorIds: new Set(),
      }),
    ).toBe(true);
  });

  it("lets a leader open team colaborators and their own queue", () => {
    expect(
      canStaffOpenQueue({
        actorRole: "leader",
        actorId: "lead-1",
        target: colaborator,
        leaderTeamColaboratorIds: new Set(["c1"]),
      }),
    ).toBe(true);
    expect(
      canStaffOpenQueue({
        actorRole: "leader",
        actorId: "lead-1",
        target: leader,
        leaderTeamColaboratorIds: new Set(["c1"]),
      }),
    ).toBe(true);
  });

  it("does not let a leader open a colaborator outside their teams", () => {
    expect(
      canStaffOpenQueue({
        actorRole: "leader",
        actorId: "lead-1",
        target: colaborator,
        leaderTeamColaboratorIds: new Set(["c-other"]),
      }),
    ).toBe(false);
  });

  it("does not let a leader manage another leader", () => {
    expect(
      canStaffOpenQueue({
        actorRole: "leader",
        actorId: "lead-1",
        target: { ...leader, id: "lead-2" },
        leaderTeamColaboratorIds: new Set(["lead-2"]),
      }),
    ).toBe(false);
  });
});

describe("isQueueProfileRole", () => {
  it("accepts roles that may appear on a production queue", () => {
    expect(isQueueProfileRole("colaborator")).toBe(true);
    expect(isQueueProfileRole("leader")).toBe(true);
    expect(isQueueProfileRole("manager")).toBe(true);
    expect(isQueueProfileRole("admin")).toBe(true);
    expect(isQueueProfileRole("kiosk")).toBe(false);
  });
});
