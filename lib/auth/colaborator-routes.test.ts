import { describe, expect, it } from "vitest";

import {
  isColaboratorPrivatePath,
  isKioskPanelPath,
  KIOSK_HOME_PATH,
  LOGIN_PATH,
  resolveRouteAccess,
} from "./colaborator-routes";

describe("isColaboratorPrivatePath", () => {
  it("matches single-segment document id paths", () => {
    expect(isColaboratorPrivatePath("/abc123")).toBe(true);
  });

  it("rejects reserved and nested paths", () => {
    expect(isColaboratorPrivatePath("/board")).toBe(false);
    expect(isColaboratorPrivatePath("/kiosk")).toBe(false);
    expect(isColaboratorPrivatePath("/tasks/abc")).toBe(false);
  });
});

describe("resolveRouteAccess", () => {
  it("redirects unlogged users on private path to login", () => {
    expect(
      resolveRouteAccess("/col-1", { isAuthenticated: false }),
    ).toEqual({ action: "redirect", destination: LOGIN_PATH });
  });

  it("redirects unlogged users on kiosk paths to login with callback", () => {
    expect(
      resolveRouteAccess("/kiosk", { isAuthenticated: false }),
    ).toEqual({
      action: "redirect",
      destination: `${LOGIN_PATH}?callbackUrl=%2Fkiosk`,
    });

    expect(
      resolveRouteAccess("/kiosk/col-1", { isAuthenticated: false }),
    ).toEqual({
      action: "redirect",
      destination: `${LOGIN_PATH}?callbackUrl=%2Fkiosk`,
    });
  });

  it("allows kiosk role on kiosk routes", () => {
    expect(
      resolveRouteAccess("/kiosk", {
        isAuthenticated: true,
        role: "kiosk",
        userId: "kiosk-1",
      }),
    ).toEqual({ action: "allow" });

    expect(
      resolveRouteAccess("/kiosk/col-1", {
        isAuthenticated: true,
        role: "kiosk",
        userId: "kiosk-1",
      }),
    ).toEqual({ action: "allow" });
  });

  it("redirects colaborator on kiosk routes to private path", () => {
    expect(
      resolveRouteAccess("/kiosk", {
        isAuthenticated: true,
        role: "colaborator",
        userId: "col-1",
      }),
    ).toEqual({ action: "redirect", destination: "/col-1" });
  });

  it("redirects staff on kiosk routes to home", () => {
    expect(
      resolveRouteAccess("/kiosk", {
        isAuthenticated: true,
        role: "manager",
        userId: "mgr-1",
      }),
    ).toEqual({ action: "redirect", destination: "/" });
  });

  it("redirects colaborator on staff routes to private path", () => {
    expect(
      resolveRouteAccess("/board", {
        isAuthenticated: true,
        role: "colaborator",
        userId: "col-1",
      }),
    ).toEqual({ action: "redirect", destination: "/col-1" });
  });

  it("redirects colaborator on wrong private path to own id", () => {
    expect(
      resolveRouteAccess("/other-col", {
        isAuthenticated: true,
        role: "colaborator",
        userId: "col-1",
      }),
    ).toEqual({ action: "redirect", destination: "/col-1" });
  });

  it("allows colaborator on own private path", () => {
    expect(
      resolveRouteAccess("/col-1", {
        isAuthenticated: true,
        role: "colaborator",
        userId: "col-1",
      }),
    ).toEqual({ action: "allow" });
  });

  it("redirects kiosk away from staff and colaborator paths", () => {
    expect(
      resolveRouteAccess("/board", {
        isAuthenticated: true,
        role: "kiosk",
        userId: "kiosk-1",
      }),
    ).toEqual({ action: "redirect", destination: KIOSK_HOME_PATH });

    expect(
      resolveRouteAccess("/col-1", {
        isAuthenticated: true,
        role: "kiosk",
        userId: "kiosk-1",
      }),
    ).toEqual({ action: "redirect", destination: KIOSK_HOME_PATH });
  });

  it("redirects unlogged staff routes to login", () => {
    expect(
      resolveRouteAccess("/board", { isAuthenticated: false }),
    ).toEqual({ action: "redirect", destination: LOGIN_PATH });
  });

  it("allows leader on staff routes when authenticated", () => {
    expect(
      resolveRouteAccess("/board", {
        isAuthenticated: true,
        role: "leader",
        userId: "lead-1",
      }),
    ).toEqual({ action: "allow" });
  });
});

describe("isKioskPanelPath", () => {
  it("detects kiosk document routes only", () => {
    expect(isKioskPanelPath("/kiosk/col-1")).toBe(true);
    expect(isKioskPanelPath("/kiosk")).toBe(false);
  });
});
