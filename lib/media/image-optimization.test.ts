import { describe, expect, it } from "vitest";

import { shouldUseUnoptimizedImage } from "./image-optimization";

describe("shouldUseUnoptimizedImage", () => {
  it("skips optimization for blob preview URLs", () => {
    expect(shouldUseUnoptimizedImage("blob:http://localhost/abc")).toBe(true);
  });

  it("optimizes same-origin media proxy URLs", () => {
    expect(shouldUseUnoptimizedImage("/api/media/abc")).toBe(false);
    expect(shouldUseUnoptimizedImage("/api/kiosk/face-media/abc")).toBe(false);
  });

  it("skips optimization for external URLs", () => {
    expect(shouldUseUnoptimizedImage("https://cdn.example.com/a.png")).toBe(
      true,
    );
  });
});
