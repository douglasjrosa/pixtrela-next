import { describe, expect, it } from "vitest";

import {
  MEDIA_THUMBNAIL_FRAME_CLASS,
  MEDIA_THUMBNAIL_IMAGE_CLASS,
} from "./media-thumbnail-styles";

describe("media-thumbnail-styles", () => {
  it("uses an opaque white frame and one-third image sizing", () => {
    expect(MEDIA_THUMBNAIL_FRAME_CLASS).toContain("bg-white");
    expect(MEDIA_THUMBNAIL_IMAGE_CLASS).toContain("size-1/3");
    expect(MEDIA_THUMBNAIL_IMAGE_CLASS).toContain("object-contain");
  });
});
