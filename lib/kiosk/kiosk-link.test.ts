import { describe, expect, it } from "vitest";

import { buildKioskColaboratorPath } from "./kiosk-link";

describe("buildKioskColaboratorPath", () => {
  it("builds the kiosk route for a document id", () => {
    expect(buildKioskColaboratorPath("col-abc")).toBe("/kiosk/col-abc");
  });
});
