import { describe, expect, it } from "vitest";

import {
  DEFAULT_KIOSK_ENTRY_ACCESS,
  DEFAULT_LOGIN_ENTRY_ACCESS,
  defaultEntryAccessForSurface,
  directEntryStep,
  entryDeviceFromMediaQuery,
  entryNfcActive,
  pickEntryAccessMethods,
  resolveEntryStep,
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

describe("directEntryStep", () => {
  it("skips the chooser when login and password is the only button", () => {
    expect(
      directEntryStep({
        username: true,
        code: false,
        face: false,
        nfc: true,
      }),
    ).toBe("username");
  });

  it("keeps the chooser when two buttons are enabled", () => {
    expect(
      directEntryStep({
        username: true,
        code: true,
        face: false,
        nfc: true,
      }),
    ).toBeNull();
  });

  it("opens face or code when that button is alone", () => {
    expect(
      directEntryStep({
        username: false,
        code: false,
        face: true,
        nfc: false,
      }),
    ).toBe("face1n");
    expect(
      directEntryStep({
        username: false,
        code: true,
        face: false,
        nfc: false,
      }),
    ).toBe("code");
  });

  it("stays on the chooser when only NFC is enabled", () => {
    expect(
      directEntryStep({
        username: false,
        code: false,
        face: false,
        nfc: true,
      }),
    ).toBeNull();
  });
});

describe("resolveEntryStep", () => {
  const usernameAndNfc = {
    username: true,
    code: false,
    face: false,
    nfc: true,
  };

  it("replaces the chooser with the only button step", () => {
    expect(resolveEntryStep("choose", usernameAndNfc)).toBe("username");
  });

  it("keeps a step the person already opened", () => {
    expect(
      resolveEntryStep("code", {
        username: true,
        code: true,
        face: true,
        nfc: false,
      }),
    ).toBe("code");
  });
});

describe("entryNfcActive", () => {
  const usernameAndNfc = {
    username: true,
    code: false,
    face: false,
    nfc: true,
  };

  it("keeps NFC listening on the skipped login form", () => {
    expect(entryNfcActive(usernameAndNfc, "username")).toBe(true);
  });

  it("listens on the chooser and stops after a chosen button", () => {
    const methods = {
      username: true,
      code: true,
      face: false,
      nfc: true,
    };
    expect(entryNfcActive(methods, "choose")).toBe(true);
    expect(entryNfcActive(methods, "username")).toBe(false);
  });
});
