import { describe, expect, it } from "vitest";

import {
  extensionFromMime,
  isAllowedLibraryMime,
  isImageMime,
} from "./media-mime";

describe("media-mime", () => {
  it("derives extension from mime and filename", () => {
    expect(extensionFromMime("image/png")).toBe("png");
    expect(extensionFromMime("application/pdf")).toBe("pdf");
    expect(extensionFromMime("image/jpeg", "photo.WEBP")).toBe("webp");
  });

  it("accepts library mime types", () => {
    expect(isAllowedLibraryMime("image/png")).toBe(true);
    expect(isAllowedLibraryMime("application/pdf")).toBe(true);
    expect(isAllowedLibraryMime("text/plain")).toBe(false);
  });

  it("detects image mime", () => {
    expect(isImageMime("image/svg+xml")).toBe(true);
    expect(isImageMime("application/pdf")).toBe(false);
  });
});
