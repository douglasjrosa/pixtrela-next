import { describe, expect, it } from "vitest";

import { buildUserKioskPath, isUserKioskPath } from "./user-kiosk-path";

const RESERVED = new Set(["kiosk", "board", "login"]);

describe("buildUserKioskPath", () => {
  it("nests kiosk under the user document id", () => {
    expect(buildUserKioskPath("col-1")).toBe("/col-1/kiosk");
  });
});

describe("isUserKioskPath", () => {
  it("matches a personal totem route", () => {
    expect(isUserKioskPath("/col-1/kiosk", RESERVED)).toBe(true);
  });

  it("rejects the factory kiosk and reserved first segments", () => {
    expect(isUserKioskPath("/kiosk", RESERVED)).toBe(false);
    expect(isUserKioskPath("/kiosk/col-1", RESERVED)).toBe(false);
    expect(isUserKioskPath("/board/kiosk", RESERVED)).toBe(false);
    expect(isUserKioskPath("/col-1/kiosk/extra", RESERVED)).toBe(false);
  });
});
