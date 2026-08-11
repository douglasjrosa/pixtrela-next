import { describe, expect, it } from "vitest";

import { toKioskFaceMediaProxyUrl } from "@/lib/kiosk/face/face-media-proxy-url";
import { toBrowserMediaUrl } from "@/lib/strapi/browser-media-url";

const R2_SAMPLE =
  "https://media.example.test/8fd2458d-8e8e-4c44-ae16-bab87a05ab59.jpg";
const STRAPI_UPLOAD = "http://127.0.0.1:1337/uploads/face.jpg";

/**
 * Regression matrix for every <img> / background-image surface.
 * Display URLs may use the CDN directly; face-api surfaces need same-origin proxy.
 */
describe("browser image surfaces", () => {
  describe("display (no crossOrigin)", () => {
    const resolve = (raw: string | null) => toBrowserMediaUrl(raw);

    it("users list avatar", () => {
      expect(resolve(R2_SAMPLE)).toBe(R2_SAMPLE);
    });

    it("user media fields", () => {
      expect(resolve("/api/media/local.jpg")).toBe("/api/media/local.jpg");
    });

    it("award list image", () => {
      expect(resolve(R2_SAMPLE)).toBe(R2_SAMPLE);
    });

    it("award card", () => {
      expect(resolve(R2_SAMPLE)).toBe(R2_SAMPLE);
    });

    it("currency icon", () => {
      expect(resolve(R2_SAMPLE)).toBe(R2_SAMPLE);
    });

    it("profile avatar editor", () => {
      expect(resolve(R2_SAMPLE)).toBe(R2_SAMPLE);
    });

    it("kiosk welcome", () => {
      expect(resolve(R2_SAMPLE)).toBe(R2_SAMPLE);
    });

    it("kiosk colaborator header", () => {
      expect(resolve(R2_SAMPLE)).toBe(R2_SAMPLE);
    });

    it("theme settings preview", () => {
      expect(resolve(R2_SAMPLE)).toBe(R2_SAMPLE);
    });

    it("exchange award card", () => {
      expect(resolve(R2_SAMPLE)).toBe(R2_SAMPLE);
    });
  });

  describe("face / crossOrigin anonymous", () => {
    const resolve = (raw: string | null) => toKioskFaceMediaProxyUrl(raw);

    it("kiosk face ambiguous list", () => {
      expect(resolve(R2_SAMPLE)).toBe(
        `/api/strapi-media?url=${encodeURIComponent(R2_SAMPLE)}`,
      );
    });

    it("kiosk member picker", () => {
      expect(resolve(R2_SAMPLE)).toBe(
        `/api/strapi-media?url=${encodeURIComponent(R2_SAMPLE)}`,
      );
    });

    it("kiosk colaborator face photo form", () => {
      expect(resolve(R2_SAMPLE)).toBe(
        `/api/strapi-media?url=${encodeURIComponent(R2_SAMPLE)}`,
      );
    });

    it("face reference loader keeps strapi upload on same origin", () => {
      expect(resolve(STRAPI_UPLOAD)).toBe(
        "/api/strapi-media?path=%2Fuploads%2Fface.jpg",
      );
    });

    it("local api media stays same-origin", () => {
      expect(resolve("/api/media/abc.jpg")).toBe("/api/media/abc.jpg");
    });
  });
});
