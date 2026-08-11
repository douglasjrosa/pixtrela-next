import { describe, expect, it } from "vitest";

import { toBrowserStrapiMediaUrl } from "./browser-media-url";

describe("toBrowserStrapiMediaUrl", () => {
  it("returns null for empty input", () => {
    expect(toBrowserStrapiMediaUrl(null)).toBeNull();
    expect(toBrowserStrapiMediaUrl("")).toBeNull();
  });

  it("proxies relative upload paths", () => {
    expect(toBrowserStrapiMediaUrl("/uploads/a.jpg")).toBe(
      "/api/strapi-media?path=%2Fuploads%2Fa.jpg",
    );
  });

  it("extracts path from absolute Strapi upload URLs", () => {
    expect(
      toBrowserStrapiMediaUrl("http://127.0.0.1:1337/uploads/a.jpg"),
    ).toBe("/api/strapi-media?path=%2Fuploads%2Fa.jpg");
    expect(
      toBrowserStrapiMediaUrl(
        "https://strapi.pixtrela.ribermax.com.br/uploads/a.jpg",
      ),
    ).toBe("/api/strapi-media?path=%2Fuploads%2Fa.jpg");
  });

  it("keeps existing proxy URLs", () => {
    const proxy = "/api/strapi-media?path=%2Fuploads%2Fa.jpg";
    expect(toBrowserStrapiMediaUrl(proxy)).toBe(proxy);
  });

  it("passes through local drizzle media URLs", () => {
    expect(toBrowserStrapiMediaUrl("/api/media/abc.jpg")).toBe(
      "/api/media/abc.jpg",
    );
    expect(toBrowserStrapiMediaUrl("photo.webp")).toBe("/api/media/photo.webp");
  });

  it("passes through blob preview URLs", () => {
    const blobUrl = `blob:${"http://test.invalid"}/preview-uuid`;
    expect(toBrowserStrapiMediaUrl(blobUrl)).toBe(blobUrl);
  });

  it("unwraps strapi-media proxy for R2 URLs", () => {
    const direct =
      "https://media.example.test/a004a8d1-4b11-4e11-88ec-a65d42fbb4d5.jpg";
    const proxy = `/api/strapi-media?url=${encodeURIComponent(direct)}`;
    expect(toBrowserStrapiMediaUrl(proxy)).toBe(direct);
  });

  it("uses direct CDN URLs instead of strapi-media proxy", () => {
    expect(
      toBrowserStrapiMediaUrl(
        "https://media.example.test/a004a8d1-4b11-4e11-88ec-a65d42fbb4d5.jpg",
      ),
    ).toBe(
      "https://media.example.test/a004a8d1-4b11-4e11-88ec-a65d42fbb4d5.jpg",
    );
  });

  it("passes through trusted R2 public URLs", () => {
    const previous = process.env.S3_PUBLIC_URL;
    process.env.S3_PUBLIC_URL = "https://media.example.test";
    try {
      expect(
        toBrowserStrapiMediaUrl(
          "https://media.example.test/4011e233-620a-497f-a073-3ad4e9b3aaae.jpg",
        ),
      ).toBe(
        "https://media.example.test/4011e233-620a-497f-a073-3ad4e9b3aaae.jpg",
      );
    } finally {
      if (previous === undefined) {
        delete process.env.S3_PUBLIC_URL;
      } else {
        process.env.S3_PUBLIC_URL = previous;
      }
    }
  });
});
