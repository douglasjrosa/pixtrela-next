import { describe, expect, it } from "vitest";

import { isLocallyOptimizedMediaSrc } from "./optimized-media-image";

describe("isLocallyOptimizedMediaSrc", () => {
  it("detects same-origin media API paths", () => {
    expect(isLocallyOptimizedMediaSrc("/api/media/star.png")).toBe(true);
    expect(isLocallyOptimizedMediaSrc("https://cdn.example/star.png")).toBe(false);
  });
});
