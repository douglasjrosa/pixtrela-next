import { describe, expect, it } from "vitest";

import { resolvePostLoginDestination } from "@/lib/auth/post-login-destination";

describe("resolvePostLoginDestination", () => {
  it("redirects kiosk role to /kiosk", () => {
    expect(resolvePostLoginDestination("kiosk", "kiosk-1", null)).toBe("/kiosk");
  });

  it("redirects colaborator to private path", () => {
    expect(resolvePostLoginDestination("colaborator", "col-1", null)).toBe(
      "/col-1",
    );
  });

  it("uses callbackUrl for staff when provided", () => {
    expect(resolvePostLoginDestination("manager", "mgr-1", "/board")).toBe(
      "/board",
    );
  });
});
