import { describe, expect, it } from "vitest";

import {
  APP_NAV_LINK_SURFACE_CLASS,
  appNavLinkClass,
} from "./app-nav-link-styles";

describe("appNavLinkClass", () => {
  it("applies the solid primary surface when active", () => {
    expect(appNavLinkClass(true)).toContain(APP_NAV_LINK_SURFACE_CLASS);
    expect(appNavLinkClass(true)).toContain("bg-primary");
    expect(appNavLinkClass(true)).toContain("py-2");
  });

  it("uses hover surface for inactive links", () => {
    const classes = appNavLinkClass(false);
    expect(classes).toContain("hover:bg-secondary");
    expect(classes).not.toContain(APP_NAV_LINK_SURFACE_CLASS);
  });
});
