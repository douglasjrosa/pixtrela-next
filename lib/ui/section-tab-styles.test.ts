import { describe, expect, it } from "vitest";

import {
  sectionTabLinkClass,
  SECTION_TAB_INACTIVE_HEIGHT_CLASS,
  SECTION_TAB_ACTIVE_HEIGHT_CLASS,
  SECTION_TAB_SURFACE_CLASS,
} from "./section-tab-styles";

describe("sectionTabLinkClass", () => {
  it("uses full height and opacity for the active tab", () => {
    const classes = sectionTabLinkClass(true);
    expect(classes).toContain(SECTION_TAB_ACTIVE_HEIGHT_CLASS);
    expect(classes).toContain(SECTION_TAB_SURFACE_CLASS);
    expect(classes).toContain("opacity-100");
    expect(classes).toContain("rounded-t-md");
  });

  it("uses shorter height and lower opacity for inactive tabs", () => {
    const classes = sectionTabLinkClass(false);
    expect(classes).toContain(SECTION_TAB_INACTIVE_HEIGHT_CLASS);
    expect(classes).toContain(SECTION_TAB_SURFACE_CLASS);
    expect(classes).toContain("opacity-50");
  });
});
