import { describe, expect, it } from "vitest";

import { kioskStaffSlimNavItems } from "./kiosk-staff-slim-nav";

describe("kioskStaffSlimNavItems", () => {
  it("exposes only queues and team-access for every staff role", () => {
    expect(kioskStaffSlimNavItems("lead-1")).toEqual([
      { href: "/kiosk/staff/lead-1/queues", labelKey: "queues" },
      { href: "/kiosk/staff/lead-1/team-access", labelKey: "teamAccess" },
    ]);
  });
});
