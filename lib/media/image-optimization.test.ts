import { describe, expect, it } from "vitest";

import {
  isSvgImageSrc,
  shouldUseUnoptimizedImage,
} from "./image-optimization";

describe("shouldUseUnoptimizedImage", () => {
  it("skips optimization for blob preview URLs", () => {
    expect(shouldUseUnoptimizedImage("blob:http://localhost/abc")).toBe(true);
  });

  it("optimizes same-origin raster media proxy URLs", () => {
    expect(shouldUseUnoptimizedImage("/api/media/abc.png")).toBe(false);
    expect(shouldUseUnoptimizedImage("/api/kiosk/face-media/abc")).toBe(false);
  });

  it("skips optimization for SVG so Next Image does not rasterize them", () => {
    expect(shouldUseUnoptimizedImage("/api/media/star-sheet.svg")).toBe(true);
    expect(
      shouldUseUnoptimizedImage("https://cdn.example.com/motif.svg?v=1"),
    ).toBe(true);
  });

  it("skips optimization for external URLs", () => {
    expect(shouldUseUnoptimizedImage("https://cdn.example.com/a.png")).toBe(
      true,
    );
  });
});

describe("isSvgImageSrc", () => {
  it("detects .svg paths with query strings", () => {
    expect(isSvgImageSrc("/api/media/a.svg")).toBe(true);
    expect(isSvgImageSrc("/api/media/a.SVG?x=1")).toBe(true);
    expect(isSvgImageSrc("/api/media/a.png")).toBe(false);
  });
});
