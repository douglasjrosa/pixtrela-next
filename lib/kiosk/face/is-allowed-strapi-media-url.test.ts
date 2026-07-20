import { describe, expect, it } from "vitest";

import { isAllowedStrapiMediaUrl } from "./is-allowed-strapi-media-url";

describe("isAllowedStrapiMediaUrl", () => {
  const base = "http://127.0.0.1:1337";

  it("allows uploads on the configured origin", () => {
    expect(isAllowedStrapiMediaUrl(`${base}/uploads/a.jpg`, base)).toBe(true);
  });

  it("rejects other origins, non-upload paths, and invalid urls", () => {
    expect(isAllowedStrapiMediaUrl("https://evil.test/uploads/a.jpg", base)).toBe(
      false,
    );
    expect(isAllowedStrapiMediaUrl(`${base}/api/users`, base)).toBe(false);
    expect(isAllowedStrapiMediaUrl("not-a-url", base)).toBe(false);
  });
});
