import { describe, expect, it } from "vitest";

import {
  DEFAULT_KIOSK_ENTRY_ACCESS,
  DEFAULT_LOGIN_ENTRY_ACCESS,
  defaultEntryAccessForSurface,
  entryDeviceFromMediaQuery,
  pickEntryAccessMethods,
} from "./entry-access";

describe("entry-access defaults", () => {
  it("uses login defaults for login surface", () => {
    expect(defaultEntryAccessForSurface("login")).toEqual(
      DEFAULT_LOGIN_ENTRY_ACCESS,
    );
    expect(DEFAULT_LOGIN_ENTRY_ACCESS.computer).toEqual({
      username: true,
      code: false,
      face: false,
      nfc: false,
    });
    expect(DEFAULT_LOGIN_ENTRY_ACCESS.mobile).toEqual({
      username: true,
      code: false,
      face: true,
      nfc: false,
    });
  });

  it("uses kiosk defaults for kiosk surface", () => {
    expect(defaultEntryAccessForSurface("kiosk")).toEqual(
      DEFAULT_KIOSK_ENTRY_ACCESS,
    );
    expect(DEFAULT_KIOSK_ENTRY_ACCESS.computer).toEqual({
      username: true,
      code: false,
      face: false,
      nfc: false,
    });
    expect(DEFAULT_KIOSK_ENTRY_ACCESS.mobile).toEqual({
      username: false,
      code: true,
      face: true,
      nfc: false,
    });
  });

  it("picks methods for the current device", () => {
    expect(
      pickEntryAccessMethods(DEFAULT_KIOSK_ENTRY_ACCESS, "mobile").code,
    ).toBe(true);
    expect(
      pickEntryAccessMethods(DEFAULT_KIOSK_ENTRY_ACCESS, "computer").username,
    ).toBe(true);
  });

  it("maps media query matches to device", () => {
    expect(entryDeviceFromMediaQuery(true)).toBe("mobile");
    expect(entryDeviceFromMediaQuery(false)).toBe("computer");
  });
});
