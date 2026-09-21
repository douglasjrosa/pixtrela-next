import { describe, expect, it } from "vitest";

import {
  isStaffKioskRole,
  resolveKioskPathAfterIdentify,
  resolveKioskPathForIdentifiedUser,
} from "./kiosk-identify-route";

describe("resolveKioskPathAfterIdentify", () => {
  it("routes colaborators to the production panel", () => {
    expect(resolveKioskPathAfterIdentify("col-1", "colaborator")).toBe(
      "/kiosk/col-1",
    );
  });

  it("routes staff roles to the kiosk staff area", () => {
    expect(resolveKioskPathAfterIdentify("admin-1", "admin")).toBe(
      "/kiosk/staff/admin-1",
    );
    expect(resolveKioskPathAfterIdentify("mgr-1", "manager")).toBe(
      "/kiosk/staff/mgr-1",
    );
    expect(resolveKioskPathAfterIdentify("lead-1", "leader")).toBe(
      "/kiosk/staff/lead-1",
    );
  });
});

describe("resolveKioskPathForIdentifiedUser", () => {
  it("routes unknown roles to the colaborator panel", () => {
    expect(resolveKioskPathForIdentifiedUser("u1", undefined)).toBe("/kiosk/u1");
    expect(resolveKioskPathForIdentifiedUser("u1", "kiosk")).toBe("/kiosk/u1");
  });

  it("routes staff and colaborators to their kiosk destinations", () => {
    expect(resolveKioskPathForIdentifiedUser("c1", "colaborator")).toBe(
      "/kiosk/c1",
    );
    expect(resolveKioskPathForIdentifiedUser("a1", "admin")).toBe(
      "/kiosk/staff/a1",
    );
  });
});

describe("isStaffKioskRole", () => {
  it("returns true only for non-colaborator roles", () => {
    expect(isStaffKioskRole("colaborator")).toBe(false);
    expect(isStaffKioskRole("admin")).toBe(true);
  });
});
