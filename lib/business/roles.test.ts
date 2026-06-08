import { describe, expect, it } from "vitest";

import { canDeleteUsers, canManageRole, manageableTargetRoles } from "./roles";

describe("manageableTargetRoles", () => {
  it("returns assignable roles for actor", () => {
    expect(manageableTargetRoles("leader")).toEqual(["colaborator"]);
    expect(manageableTargetRoles("admin")).toEqual([
      "manager",
      "leader",
      "colaborator",
      "kiosk",
    ]);
  });
});

describe("canManageRole", () => {
  it("allows admin to manage all lower roles including kiosk", () => {
    expect(canManageRole("admin", "manager")).toBe(true);
    expect(canManageRole("admin", "colaborator")).toBe(true);
    expect(canManageRole("admin", "kiosk")).toBe(true);
  });

  it("denies manager from managing kiosk", () => {
    expect(canManageRole("manager", "kiosk")).toBe(false);
  });

  it("allows manager to manage leader and colaborator", () => {
    expect(canManageRole("manager", "leader")).toBe(true);
    expect(canManageRole("manager", "manager")).toBe(false);
  });

  it("allows leader to manage colaborator only", () => {
    expect(canManageRole("leader", "colaborator")).toBe(true);
    expect(canManageRole("leader", "leader")).toBe(false);
  });
});

describe("canDeleteUsers", () => {
  it("allows admin only", () => {
    expect(canDeleteUsers("admin")).toBe(true);
    expect(canDeleteUsers("manager")).toBe(false);
  });
});
