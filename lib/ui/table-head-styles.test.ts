import { describe, expect, it } from "vitest";

import { listSortHeaderFontClass } from "./table-head-styles";

describe("listSortHeaderFontClass", () => {
  it("uses semibold when the column is the active sort", () => {
    expect(listSortHeaderFontClass(true)).toBe("font-semibold");
  });

  it("uses medium weight for inactive sort columns", () => {
    expect(listSortHeaderFontClass(false)).toBe("font-medium");
  });
});
