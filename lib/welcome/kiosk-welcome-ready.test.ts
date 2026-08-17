import { afterEach, describe, expect, it } from "vitest";

import {
  isKioskColaboratorReady,
  markKioskColaboratorReady,
  resetKioskColaboratorReady,
} from "./kiosk-welcome-ready";

describe("kiosk-welcome-ready", () => {
  afterEach(() => {
    resetKioskColaboratorReady();
  });

  it("starts unset and becomes ready after mark", () => {
    expect(isKioskColaboratorReady()).toBe(false);
    markKioskColaboratorReady();
    expect(isKioskColaboratorReady()).toBe(true);
    resetKioskColaboratorReady();
    expect(isKioskColaboratorReady()).toBe(false);
  });
});