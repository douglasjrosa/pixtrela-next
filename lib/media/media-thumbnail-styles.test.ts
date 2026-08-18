import { describe, expect, it } from "vitest";

import {
  MEDIA_THUMBNAIL_FRAME_CLASS,
  MEDIA_THUMBNAIL_IMAGE_CLASS,
} from "./media-thumbnail-styles";

describe("media-thumbnail-styles", () => {
  it("uses a square clipped frame with absolute cover image", () => {
    expect(MEDIA_THUMBNAIL_FRAME_CLASS).toContain("aspect-square");
    expect(MEDIA_THUMBNAIL_FRAME_CLASS).toContain("overflow-hidden");
    expect(MEDIA_THUMBNAIL_IMAGE_CLASS).toContain("absolute");
    expect(MEDIA_THUMBNAIL_IMAGE_CLASS).toContain("object-cover");
  });
});
