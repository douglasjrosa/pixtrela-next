import { describe, expect, it } from "vitest";

import { canViewUser, leaderColaboratorFilter } from "./team-scope";

describe("leaderColaboratorFilter", () => {
  it("filters colaborators by leader team", () => {
    expect(leaderColaboratorFilter("5")).toMatchObject({
      role: { type: { $eq: "colaborator" } },
    });
  });
});

describe("canViewUser", () => {
  it("allows admin to see anyone", () => {
    expect(
      canViewUser("admin", "1", { id: "2", roleType: "colaborator" }),
    ).toBe(true);
  });

  it("allows leader to see own team colaborator", () => {
    expect(
      canViewUser("leader", "10", {
        id: "20",
        roleType: "colaborator",
        teamLeaderIds: ["10"],
      }),
    ).toBe(true);
  });

  it("denies leader viewing other team colaborator", () => {
    expect(
      canViewUser("leader", "10", {
        id: "20",
        roleType: "colaborator",
        teamLeaderIds: ["99"],
      }),
    ).toBe(false);
  });
});
