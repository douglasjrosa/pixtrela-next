import { describe, expect, it } from "vitest";

import { toKioskFaceMediaProxyUrl } from "./face-media-proxy-url";

describe("toKioskFaceMediaProxyUrl", () => {
  it("proxies absolute upload URLs via strapi-media path", () => {
    expect(
      toKioskFaceMediaProxyUrl("http://127.0.0.1:1337/uploads/a.jpg"),
    ).toBe("/api/strapi-media?path=%2Fuploads%2Fa.jpg");
  });

  it("proxies R2 public URLs for CORS-safe face-api loads", () => {
    const r2 =
      "https://media.example.test/8fd2458d-8e8e-4c44-ae16-bab87a05ab59.jpg";
    expect(toKioskFaceMediaProxyUrl(r2)).toBe(
      `/api/strapi-media?url=${encodeURIComponent(r2)}`,
    );
  });

  it("keeps same-origin media paths", () => {
    expect(toKioskFaceMediaProxyUrl("/api/media/photo.jpg")).toBe(
      "/api/media/photo.jpg",
    );
  });
});
