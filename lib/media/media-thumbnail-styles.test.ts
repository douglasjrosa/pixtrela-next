import { describe, expect, it } from "vitest";

import {
  MEDIA_THUMBNAIL_FRAME_CLASS,
  MEDIA_THUMBNAIL_IMAGE_CLASS,
} from "./media-thumbnail-styles";

describe("media-thumbnail-styles", () => {
  it("uses a translucent white frame and full-size image cover", () => {
    expect(MEDIA_THUMBNAIL_FRAME_CLASS).toContain("bg-white/15");
    expect(MEDIA_THUMBNAIL_IMAGE_CLASS).toContain("size-full");
    expect(MEDIA_THUMBNAIL_IMAGE_CLASS).toContain("object-cover");
  });
});
