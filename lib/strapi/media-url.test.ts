import { describe, expect, it, vi, afterEach } from "vitest";

import { resolveStrapiMediaUrl } from "./media-url";

describe("resolveStrapiMediaUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null for empty input", () => {
    expect(resolveStrapiMediaUrl(null)).toBeNull();
    expect(resolveStrapiMediaUrl(undefined)).toBeNull();
    expect(resolveStrapiMediaUrl("")).toBeNull();
  });

  it("prefixes relative paths with STRAPI_URL", () => {
    vi.stubEnv("STRAPI_URL", "https://strapi.pixtrela.ribermax.com.br");
    expect(resolveStrapiMediaUrl("/uploads/photo.png")).toBe(
      "https://strapi.pixtrela.ribermax.com.br/uploads/photo.png",
    );
  });

  it("rewrites localhost absolute URLs to STRAPI_URL", () => {
    vi.stubEnv("STRAPI_URL", "https://strapi.pixtrela.ribermax.com.br");
    expect(
      resolveStrapiMediaUrl("http://127.0.0.1:1337/uploads/photo.png"),
    ).toBe("https://strapi.pixtrela.ribermax.com.br/uploads/photo.png");
    expect(
      resolveStrapiMediaUrl("http://localhost:1337/uploads/photo.png"),
    ).toBe("https://strapi.pixtrela.ribermax.com.br/uploads/photo.png");
  });

  it("keeps production absolute URLs unchanged", () => {
    vi.stubEnv("STRAPI_URL", "https://strapi.pixtrela.ribermax.com.br");
    const url = "https://strapi.pixtrela.ribermax.com.br/uploads/photo.png";
    expect(resolveStrapiMediaUrl(url)).toBe(url);
  });
});
