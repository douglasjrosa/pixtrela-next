import { afterEach, describe, expect, it } from "vitest";

import { isBrowserTabVisible } from "./is-browser-tab-visible";

describe("isBrowserTabVisible", () => {
  afterEach(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  it("is true only while the tab is visible", () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    expect(isBrowserTabVisible()).toBe(true);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    expect(isBrowserTabVisible()).toBe(false);
  });
});
