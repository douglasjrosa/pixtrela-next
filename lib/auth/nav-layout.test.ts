import { describe, expect, it } from "vitest";

import {
  NAV_LARGE_MIN_WIDTH,
  NAV_MEDIUM_MIN_WIDTH,
  doesNavFit,
  resolveNavLayoutMode,
} from "./nav-layout";

describe("doesNavFit", () => {
  it("returns true when required width fits available space", () => {
    expect(doesNavFit(400, 320)).toBe(true);
  });

  it("returns false when required width exceeds available space", () => {
    expect(doesNavFit(280, 320)).toBe(false);
  });

  it("returns true when widths are equal", () => {
    expect(doesNavFit(320, 320)).toBe(true);
  });
});

describe("resolveNavLayoutMode", () => {
  it("forces desktop on large viewports", () => {
    expect(
      resolveNavLayoutMode({
        viewportWidth: NAV_LARGE_MIN_WIDTH,
        availableWidth: 100,
        requiredWidth: 500,
      }),
    ).toBe("desktop");
  });

  it("forces mobile below medium viewport", () => {
    expect(
      resolveNavLayoutMode({
        viewportWidth: NAV_MEDIUM_MIN_WIDTH - 1,
        availableWidth: 800,
        requiredWidth: 200,
      }),
    ).toBe("mobile");
  });

  it("uses fit check on medium viewports when links fit", () => {
    expect(
      resolveNavLayoutMode({
        viewportWidth: NAV_MEDIUM_MIN_WIDTH,
        availableWidth: 400,
        requiredWidth: 320,
      }),
    ).toBe("desktop");
  });

  it("uses mobile on medium viewports when links do not fit", () => {
    expect(
      resolveNavLayoutMode({
        viewportWidth: NAV_MEDIUM_MIN_WIDTH,
        availableWidth: 200,
        requiredWidth: 320,
      }),
    ).toBe("mobile");
  });
});
