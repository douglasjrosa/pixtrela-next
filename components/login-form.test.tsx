import { describe, expect, it } from "vitest";

import { KIOSK_HOME_PATH } from "@/lib/auth/colaborator-routes";
import type { Role } from "@/lib/auth/nav";

function resolvePostLoginDestination(
  role: Role | undefined,
  userId: string | undefined,
  callbackUrl: string | null,
): string {
  if (role === "kiosk") return KIOSK_HOME_PATH;
  if (role === "colaborator" && userId) return `/${userId}`;
  if (callbackUrl?.startsWith("/")) return callbackUrl;
  return "/";
}

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
