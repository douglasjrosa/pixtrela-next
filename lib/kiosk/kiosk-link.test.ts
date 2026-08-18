import { describe, expect, it } from "vitest";

import {
  buildKioskColaboratorPath,
  isKioskColaboratorPanelPath,
} from "./kiosk-link";

describe("buildKioskColaboratorPath", () => {
  it("builds the kiosk route for a document id", () => {
    expect(buildKioskColaboratorPath("col-abc")).toBe("/kiosk/col-abc");
  });
});

describe("isKioskColaboratorPanelPath", () => {
  it("matches the colaborator panel route", () => {
    expect(isKioskColaboratorPanelPath("/kiosk/col-abc")).toBe(true);
  });

  it("rejects home and staff routes", () => {
    expect(isKioskColaboratorPanelPath("/kiosk")).toBe(false);
    expect(isKioskColaboratorPanelPath("/kiosk/staff/u1")).toBe(false);
  });
});
