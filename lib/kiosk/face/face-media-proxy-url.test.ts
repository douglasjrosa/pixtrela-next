import { describe, expect, it } from "vitest";

import { toKioskFaceMediaProxyUrl } from "./face-media-proxy-url";

describe("toKioskFaceMediaProxyUrl", () => {
  it("encodes the absolute url as a query param", () => {
    expect(
      toKioskFaceMediaProxyUrl("http://127.0.0.1:1337/uploads/a.jpg"),
    ).toBe(
      "/api/kiosk/face-media?url=http%3A%2F%2F127.0.0.1%3A1337%2Fuploads%2Fa.jpg",
    );
  });
});
