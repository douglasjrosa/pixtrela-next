import { describe, expect, it } from "vitest";

import {
  buildKioskColaboratorPath,
  buildKioskColaboratorUrl,
} from "./kiosk-link";

describe("buildKioskColaboratorPath", () => {
  it("builds the kiosk route for a document id", () => {
    expect(buildKioskColaboratorPath("col-abc")).toBe("/kiosk/col-abc");
  });
});

describe("buildKioskColaboratorUrl", () => {
  it("prefixes the path with the app origin", () => {
    expect(buildKioskColaboratorUrl("col-abc", "https://pixtrela.com")).toBe(
      "https://pixtrela.com/kiosk/col-abc",
    );
  });
});

