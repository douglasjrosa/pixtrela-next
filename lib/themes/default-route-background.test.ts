import { describe, expect, it } from "vitest";

import { DEFAULT_SEMANTIC_TOKENS } from "@/lib/themes/semantic-tokens";

import {
  DEFAULT_ROUTE_BACKGROUND_IMAGE_COLOR,
  DEFAULT_ROUTE_BACKGROUND_IMAGE_COLOR_KEY,
  DEFAULT_ROUTE_BACKGROUND_IMAGE_PATH,
  isDefaultRouteBackgroundImage,
  resolveDefaultIllustrationColor,
  resolveRouteThemeBackgroundImage,
} from "./default-route-background";

describe("default route background", () => {
  it("points at the bundled star sheet in /public/images", () => {
    expect(DEFAULT_ROUTE_BACKGROUND_IMAGE_PATH).toBe("/images/star-sheet.svg");
  });

  it("uses muted-foreground as the default illustration fill", () => {
    expect(DEFAULT_ROUTE_BACKGROUND_IMAGE_COLOR_KEY).toBe("muted-foreground");
    expect(DEFAULT_ROUTE_BACKGROUND_IMAGE_COLOR).toBe("#737373");
  });

  it("resolves Texto suave from live semantic tokens", () => {
    expect(
      resolveDefaultIllustrationColor({
        ...DEFAULT_SEMANTIC_TOKENS,
        "muted-foreground": "#aabbcc",
      }),
    ).toBe("#aabbcc");
  });

  it("recognizes the bundled path with optional query strings", () => {
    expect(isDefaultRouteBackgroundImage("/images/star-sheet.svg")).toBe(true);
    expect(isDefaultRouteBackgroundImage("/images/star-sheet.svg?v=1")).toBe(
      true,
    );
    expect(isDefaultRouteBackgroundImage("/api/media/star-sheet.svg")).toBe(
      false,
    );
  });

  it("prefers the public file over a media-library URL", () => {
    expect(
      resolveRouteThemeBackgroundImage({
        useDefaultBackgroundImage: true,
        mediaUrl: "/api/media/other.png",
      }),
    ).toEqual({
      url: DEFAULT_ROUTE_BACKGROUND_IMAGE_PATH,
      usesDefault: true,
    });
    expect(
      resolveRouteThemeBackgroundImage({
        useDefaultBackgroundImage: false,
        mediaUrl: "/api/media/other.png",
      }),
    ).toEqual({ url: "/api/media/other.png", usesDefault: false });
  });
});
