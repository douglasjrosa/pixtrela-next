import { describe, expect, it } from "vitest";

import { toKioskFaceMediaProxyUrl } from "./face-media-proxy-url";

describe("toKioskFaceMediaProxyUrl", () => {
  it("proxies absolute upload URLs via strapi-media path", () => {
    expect(
      toKioskFaceMediaProxyUrl("http://127.0.0.1:1337/uploads/a.jpg"),
    ).toBe("/api/strapi-media?path=%2Fuploads%2Fa.jpg");
  });
});
