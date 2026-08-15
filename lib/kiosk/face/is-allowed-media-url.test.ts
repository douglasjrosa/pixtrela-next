import { describe, expect, it, vi } from "vitest";

import { isAllowedMediaUrl } from "./is-allowed-media-url";

describe("isAllowedMediaUrl", () => {
  it("allows trusted public media origins", () => {
    vi.stubEnv("MEDIA_PUBLIC_BASE_URL", "https://media.example.test");
    expect(
      isAllowedMediaUrl(
        "https://media.example.test/8fd2458d-8e8e-4c44-ae16-bab87a05ab59.jpg",
      ),
    ).toBe(true);
    vi.unstubAllEnvs();
  });

  it("rejects untrusted origins", () => {
    expect(isAllowedMediaUrl("https://evil.test/uploads/a.jpg")).toBe(false);
    expect(isAllowedMediaUrl("not-a-url")).toBe(false);
  });
});
