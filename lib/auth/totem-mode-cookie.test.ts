import { describe, expect, it } from "vitest";

import {
  isTotemModeActive,
  readTotemModeUserId,
  resolveTotemMode,
  totemModeCookieOptions,
  TOTEM_MODE_COOKIE_NAME,
} from "./totem-mode-cookie";

describe("readTotemModeUserId", () => {
  it("returns a trimmed document id", () => {
    expect(readTotemModeUserId(" col-1 ")).toBe("col-1");
  });

  it("rejects empty or unsafe values", () => {
    expect(readTotemModeUserId("")).toBeUndefined();
    expect(readTotemModeUserId("col/1")).toBeUndefined();
    expect(readTotemModeUserId("col 1")).toBeUndefined();
    expect(readTotemModeUserId(null)).toBeUndefined();
  });
});

describe("isTotemModeActive", () => {
  it("is true only when cookie and session user match", () => {
    expect(isTotemModeActive("col-1", "col-1")).toBe(true);
    expect(isTotemModeActive("col-1", "lead-1")).toBe(false);
    expect(isTotemModeActive(undefined, "col-1")).toBe(false);
  });
});

describe("resolveTotemMode", () => {
  it("reads the cookie value and compares it to the session", () => {
    expect(resolveTotemMode(" col-1 ", "col-1")).toBe(true);
    expect(resolveTotemMode("col-1", "lead-1")).toBe(false);
  });
});

describe("totemModeCookieOptions", () => {
  it("is HttpOnly, Lax, and scoped to the whole site", () => {
    expect(TOTEM_MODE_COOKIE_NAME).toBe("pixtrela-totem-mode");
    expect(totemModeCookieOptions()).toEqual(
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
  });
});
