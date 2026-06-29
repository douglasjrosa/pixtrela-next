import { describe, expect, it } from "vitest";

import { canKioskSignOutDevice } from "./kiosk-staff-access";

describe("canKioskSignOutDevice", () => {
  it("allows admin and manager only", () => {
    expect(canKioskSignOutDevice("admin")).toBe(true);
    expect(canKioskSignOutDevice("manager")).toBe(true);
    expect(canKioskSignOutDevice("leader")).toBe(false);
    expect(canKioskSignOutDevice("colaborator")).toBe(false);
  });
});
