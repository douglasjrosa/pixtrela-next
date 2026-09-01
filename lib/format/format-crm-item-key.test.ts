import { describe, expect, it } from "vitest";

import { formatCrmItemKeyLabel, compareCrmItemKeys } from "./format-crm-item-key";

describe("formatCrmItemKeyLabel", () => {
  it("replaces colon separators with hyphens for display", () => {
    expect(formatCrmItemKeyLabel("4864:0")).toBe("4864-0");
    expect(formatCrmItemKeyLabel("42:0")).toBe("42-0");
  });

  it("returns empty string for missing keys", () => {
    expect(formatCrmItemKeyLabel(null)).toBe("");
    expect(formatCrmItemKeyLabel(undefined)).toBe("");
  });
});

describe("compareCrmItemKeys", () => {
  it("sorts by pedido id then item index", () => {
    expect(compareCrmItemKeys("42:1", "4864:0")).toBeLessThan(0);
    expect(compareCrmItemKeys("4864:0", "4864:1")).toBeLessThan(0);
    expect(compareCrmItemKeys("4864:1", "4864:0")).toBeGreaterThan(0);
  });

  it("places missing keys after valid keys", () => {
    expect(compareCrmItemKeys(null, "4864:0")).toBeGreaterThan(0);
    expect(compareCrmItemKeys("4864:0", null)).toBeLessThan(0);
  });
});
