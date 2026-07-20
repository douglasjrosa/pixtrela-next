import { describe, expect, it } from "vitest";

import { COLABORATOR_CONTENT_SURFACE_CLASS } from "./colaborator-content-surface";

describe("colaborator-content-surface", () => {
  it("defines an opaque content panel", () => {
    expect(COLABORATOR_CONTENT_SURFACE_CLASS).toContain("border");
    expect(COLABORATOR_CONTENT_SURFACE_CLASS).not.toContain("bg-card");
    expect(COLABORATOR_CONTENT_SURFACE_CLASS).not.toContain("rounded-2xl");
  });
});
