import { describe, expect, it } from "vitest";

import { canEstablishAppSession } from "./auth-session";

describe("canEstablishAppSession", () => {
  it("allows human roles and rejects kiosk/blocked", () => {
    expect(canEstablishAppSession("manager", false)).toBe(true);
    expect(canEstablishAppSession("colaborator", false)).toBe(true);
    expect(canEstablishAppSession("kiosk", false)).toBe(false);
    expect(canEstablishAppSession("admin", true)).toBe(false);
  });
});
