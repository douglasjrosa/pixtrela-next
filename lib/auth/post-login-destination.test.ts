import { describe, expect, it } from "vitest";

import { resolvePostLoginDestination } from "./post-login-destination";

describe("resolvePostLoginDestination", () => {
  it("sends kiosk role to the kiosk home", () => {
    expect(resolvePostLoginDestination("kiosk", "k1", "/board")).toBe("/kiosk");
  });

  it("sends colaborator to their profile path", () => {
    expect(resolvePostLoginDestination("colaborator", "c1", null)).toBe("/c1");
  });

  it("prefers relative callback for staff", () => {
    expect(resolvePostLoginDestination("admin", "a1", "/board")).toBe("/board");
  });

  it("falls back to home for staff without callback", () => {
    expect(resolvePostLoginDestination("manager", "m1", null)).toBe("/");
  });
});
