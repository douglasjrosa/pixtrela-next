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
});
