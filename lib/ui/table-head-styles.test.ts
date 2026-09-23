import { describe, expect, it } from "vitest";

import {
  listSortHeaderFontClass,
  listSortHeaderLinkClass,
} from "./table-head-styles";

describe("listSortHeaderFontClass", () => {
  it("uses semibold when the column is the active sort", () => {
    expect(listSortHeaderFontClass(true)).toBe("font-semibold");
  });

  it("uses medium weight for inactive sort columns", () => {
    expect(listSortHeaderFontClass(false)).toBe("font-medium");
  });
});

describe("listSortHeaderLinkClass", () => {
  it("highlights the active sort column with inverted colors", () => {
    expect(listSortHeaderLinkClass(true)).toContain("bg-primary");
    expect(listSortHeaderLinkClass(true)).toContain("text-primary-foreground");
  });

  it("keeps primary text on inactive sort columns", () => {
    expect(listSortHeaderLinkClass(false)).toContain("text-primary");
    expect(listSortHeaderLinkClass(false)).not.toContain("bg-primary");
  });
});
