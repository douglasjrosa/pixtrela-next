import { describe, expect, it } from "vitest";

import { canViewUser } from "./team-scope";

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
