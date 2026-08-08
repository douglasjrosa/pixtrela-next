import { describe, expect, it } from "vitest";

import {
  resolvePostLoginDestination,
  sanitizeCallbackUrl,
} from "./post-login-destination";

describe("sanitizeCallbackUrl", () => {
  it("rejects open redirects and login paths", () => {
    expect(sanitizeCallbackUrl("//evil.example")).toBeNull();
    expect(sanitizeCallbackUrl("/login")).toBeNull();
    expect(sanitizeCallbackUrl("/login?callbackUrl=%2Fkiosk")).toBeNull();
    expect(sanitizeCallbackUrl("https://example.com")).toBeNull();
  });

  it("keeps safe relative paths", () => {
    expect(sanitizeCallbackUrl("/board")).toBe("/board");
    expect(sanitizeCallbackUrl("/kiosk")).toBe("/kiosk");
  });
});

describe("resolvePostLoginDestination", () => {
  it("sends kiosk role to the kiosk home", () => {
    expect(resolvePostLoginDestination("kiosk", "k1", "/board")).toBe("/kiosk");
  });

  it("sends colaborator to their private path", () => {
    expect(resolvePostLoginDestination("colaborator", "c1", null)).toBe("/c1");
    expect(resolvePostLoginDestination("colaborator", "c1", "/kiosk")).toBe(
      "/c1",
    );
  });

  it("prefers relative callback for staff when accessible", () => {
    expect(resolvePostLoginDestination("admin", "a1", "/board")).toBe("/board");
  });

  it("ignores staff callbacks that middleware would bounce", () => {
    expect(resolvePostLoginDestination("manager", "m1", "/kiosk")).toBe("/");
    expect(resolvePostLoginDestination("manager", "m1", "/m1")).toBe("/");
    expect(resolvePostLoginDestination("admin", "a1", "/login")).toBe("/");
  });

  it("allows manager own profile callback", () => {
    expect(resolvePostLoginDestination("manager", "m1", "/m1/profile")).toBe(
      "/m1/profile",
    );
  });

  it("falls back to home for staff without callback", () => {
    expect(resolvePostLoginDestination("manager", "m1", null)).toBe("/");
  });
});
