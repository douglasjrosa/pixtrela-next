import { describe, expect, it } from "vitest";

import {
  computeParallaxOffset,
  hasVisibleColorOverlay,
  hexToRgba,
  matchRouteTheme,
  maxParallaxTravelPx,
  normalizeOpacity,
  normalizeParallaxIntensity,
  parallaxLayerGeometry,
  parallaxLayerPixelGeometry,
  resolveRouteThemeKey,
  routeThemeColorOverlayRgba,
  routeThemeContentFrameClass,
  routeThemeContentSurfaceRadiusClass,
  routeThemeContentSurfaceTopRadiusClass,
  routeThemeForegroundStyle,
  routeThemeSurfaceBackgroundStyle,
  routeThemeSurfacePanelStyle,
  normalizeForegroundColor,
  normalizeSurfaceColor,
  pageMarginFromStoredIndex,
  pageMarginToStoredIndex,
  routeThemeImagePaintStyle,
  routeThemeImageBackdropRgba,
  routeThemeLayeredStyle,
  type RouteThemeView,
} from "./match-route-theme";

const baseTheme = {
  backgroundColorOpacity: 100,
  backgroundSize: "cover" as const,
  backgroundPosition: "center" as const,
  backgroundRepeat: "no-repeat" as const,
  backgroundMotion: "scroll" as const,
  parallaxIntensity: 35,
  parallaxDirection: "normal" as const,
  contentMarginMobile: "md" as const,
  contentMarginDesktop: "lg" as const,
  foregroundColor: "#002555",
  surfaceColor: "#ffffff",
  surfaceColorOpacity: 100,
  backgroundImageColor: null,
  usesDefaultBackgroundImage: false,
};

const themes: RouteThemeView[] = [
  {
    documentId: "1",
    routeKey: "kiosk",
    label: "Totem",
    backgroundColor: "#112233",
    backgroundImageUrl: null,
    ...baseTheme,
  },
  {
    documentId: "2",
    routeKey: "colaborator",
    label: "Home",
    backgroundColor: "#ffffff",
    backgroundColorOpacity: 40,
    backgroundImageUrl: "https://cdn.example/bg.png",
    backgroundSize: "contain",
    backgroundPosition: "top",
    backgroundRepeat: "repeat",
    backgroundMotion: "scroll",
    parallaxIntensity: 35,
    parallaxDirection: "normal",
    contentMarginMobile: "md",
    contentMarginDesktop: "lg",
    foregroundColor: "#002555",
    surfaceColor: "#ffffff",
    surfaceColorOpacity: 100,
    backgroundImageColor: null,
    usesDefaultBackgroundImage: false,
  },
  {
    documentId: "3",
    routeKey: "staff-home",
    label: "Painel",
    backgroundColor: "#abcdef",
    backgroundImageUrl: null,
    ...baseTheme,
  },
];

describe("resolveRouteThemeKey", () => {
  it("maps staff home and prefixes", () => {
    expect(resolveRouteThemeKey("/")).toBe("staff-home");
    expect(resolveRouteThemeKey("/board")).toBe("board");
    expect(resolveRouteThemeKey("/tasks/abc")).toBe("tasks");
    expect(resolveRouteThemeKey("/queues")).toBe("tasks");
    expect(resolveRouteThemeKey("/queues/col-1")).toBe("tasks");
    expect(resolveRouteThemeKey("/kiosk")).toBe("kiosk");
    expect(resolveRouteThemeKey("/kiosk/user1")).toBe("kiosk");
    expect(resolveRouteThemeKey("/kiosk/staff/admin1")).toBe("kiosk-staff");
    expect(resolveRouteThemeKey("/kiosk/staff/admin1/users")).toBe(
      "kiosk-staff",
    );
    expect(resolveRouteThemeKey("/settings/themes")).toBe("settings");
    expect(resolveRouteThemeKey("/settings/themes/colors")).toBe("settings");
    expect(resolveRouteThemeKey("/settings/themes/routes")).toBe("settings");
    expect(resolveRouteThemeKey("/settings/files")).toBe("settings");
    expect(resolveRouteThemeKey("/exchanges")).toBe("exchanges");
    expect(resolveRouteThemeKey("/exchanges/batch-1")).toBe("exchanges");
  });

  it("maps colaborator documentId paths and surfaces", () => {
    expect(resolveRouteThemeKey("/abcDocumentId")).toBe("colaborator");
    expect(resolveRouteThemeKey("/abcDocumentId/store")).toBe("store");
    expect(resolveRouteThemeKey("/abcDocumentId/orders")).toBe("orders");
    expect(resolveRouteThemeKey("/abcDocumentId/orders/ord-1")).toBe("orders");
    expect(resolveRouteThemeKey("/abcDocumentId/profile")).toBe("profile");
  });
});

describe("matchRouteTheme", () => {
  it("returns the theme for the resolved key", () => {
    expect(matchRouteTheme("/kiosk", themes)?.routeKey).toBe("kiosk");
    expect(matchRouteTheme("/xyz", themes)?.backgroundImageUrl).toContain(
      "bg.png",
    );
  });
});

describe("hexToRgba", () => {
  it("converts hex with opacity", () => {
    expect(hexToRgba("#ffffff", 40)).toBe("rgba(255, 255, 255, 0.4)");
    expect(hexToRgba("#112233", 100)).toBe("rgba(17, 34, 51, 1)");
  });
});

describe("routeThemeLayeredStyle", () => {
  it("puts color gradient above the image url", () => {
    expect(routeThemeLayeredStyle(themes[1])).toEqual({
      backgroundImage:
        'linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), url("https://cdn.example/bg.png")',
      backgroundSize: "auto, contain",
      backgroundPosition: "center, top",
      backgroundRepeat: "no-repeat, repeat",
      backgroundAttachment: "scroll, scroll",
    });
  });

  it("omits color layer when transparent", () => {
    expect(
      routeThemeLayeredStyle({
        ...themes[1],
        backgroundColorOpacity: 0,
      }),
    ).toEqual({
      backgroundImage: 'url("https://cdn.example/bg.png")',
      backgroundSize: "contain",
      backgroundPosition: "top",
      backgroundRepeat: "repeat",
      backgroundAttachment: "scroll",
    });
  });

  it("paints the route color behind a full-opacity background image", () => {
    expect(
      routeThemeLayeredStyle({
        ...themes[1],
        backgroundColor: "#0044cc",
        backgroundColorOpacity: 100,
      }),
    ).toEqual({
      backgroundImage: 'url("https://cdn.example/bg.png")',
      backgroundColor: "rgba(0, 68, 204, 1)",
      backgroundSize: "contain",
      backgroundPosition: "top",
      backgroundRepeat: "repeat",
      backgroundAttachment: "scroll",
    });
  });

  it("uses fixed attachment when motion is fixed", () => {
    expect(
      routeThemeLayeredStyle({
        ...themes[1],
        backgroundColorOpacity: 0,
        backgroundMotion: "fixed",
      }),
    ).toEqual({
      backgroundImage: 'url("https://cdn.example/bg.png")',
      backgroundSize: "contain",
      backgroundPosition: "top",
      backgroundRepeat: "repeat",
      backgroundAttachment: "fixed",
    });
  });

  it("uses rgba backgroundColor when only color is set", () => {
    expect(routeThemeLayeredStyle(themes[0])).toEqual({
      backgroundColor: "rgba(17, 34, 51, 1)",
    });
  });
});

describe("routeThemeImagePaintStyle", () => {
  it("keeps a photo background when no semantic tint is set", () => {
    expect(routeThemeImagePaintStyle(themes[1])).toEqual({
      backgroundImage: 'url("https://cdn.example/bg.png")',
      backgroundSize: "contain",
      backgroundPosition: "top",
      backgroundRepeat: "repeat",
      backgroundAttachment: "scroll",
    });
  });

  it("does not tint a library photo even when a color is set", () => {
    expect(
      routeThemeImagePaintStyle({
        ...themes[1],
        backgroundImageColor: "#112233",
        usesDefaultBackgroundImage: false,
      }),
    ).toEqual({
      backgroundImage: 'url("https://cdn.example/bg.png")',
      backgroundSize: "contain",
      backgroundPosition: "top",
      backgroundRepeat: "repeat",
      backgroundAttachment: "scroll",
    });
  });

  it("masks the bundled default SVG with muted-foreground when no color is stored", () => {
    expect(
      routeThemeImagePaintStyle({
        ...themes[1],
        backgroundImageUrl: "/images/star-sheet.svg",
        usesDefaultBackgroundImage: true,
      }),
    ).toEqual({
      backgroundColor: "var(--muted-foreground)",
      WebkitMaskImage: 'url("/images/star-sheet.svg")',
      maskImage: 'url("/images/star-sheet.svg")',
      WebkitMaskSize: "contain",
      maskSize: "contain",
      WebkitMaskPosition: "top",
      maskPosition: "top",
      WebkitMaskRepeat: "repeat",
      maskRepeat: "repeat",
      maskMode: "alpha",
    });
  });

  it("masks the bundled default SVG with a stored custom color", () => {
    expect(
      routeThemeImagePaintStyle({
        ...themes[1],
        backgroundImageUrl: "/images/star-sheet.svg",
        backgroundImageColor: "#ff5500",
        usesDefaultBackgroundImage: true,
      }),
    ).toEqual(
      expect.objectContaining({
        backgroundColor: "#ff5500",
      }),
    );
  });

  it("exports a backdrop color for full-opacity images", () => {
    expect(
      routeThemeImageBackdropRgba({
        ...themes[1],
        backgroundColor: "#0044cc",
        backgroundColorOpacity: 100,
      }),
    ).toBe("rgba(0, 68, 204, 1)");
    expect(
      routeThemeImageBackdropRgba({
        ...themes[1],
        backgroundColorOpacity: 40,
      }),
    ).toBeNull();
  });
});

describe("routeThemeColorOverlayRgba", () => {
  it("skips a solid veil over a background image at 100% opacity", () => {
    expect(
      routeThemeColorOverlayRgba({
        ...themes[1],
        backgroundColorOpacity: 100,
      }),
    ).toBeNull();
  });

  it("keeps a partial tint over a background image", () => {
    expect(
      routeThemeColorOverlayRgba({
        ...themes[1],
        backgroundColorOpacity: 40,
      }),
    ).toBe("rgba(255, 255, 255, 0.4)");
  });
});

describe("hasVisibleColorOverlay", () => {
  it("is false when transparent", () => {
    expect(
      hasVisibleColorOverlay({ ...themes[0], backgroundColorOpacity: 0 }),
    ).toBe(false);
  });
});

describe("normalizeOpacity", () => {
  it("clamps values", () => {
    expect(normalizeOpacity(-10)).toBe(0);
    expect(normalizeOpacity(150)).toBe(100);
    expect(normalizeOpacity(undefined)).toBe(100);
  });
});

describe("parallax helpers", () => {
  it("clamps intensity", () => {
    expect(normalizeParallaxIntensity(-5)).toBe(0);
    expect(normalizeParallaxIntensity(200)).toBe(100);
    expect(normalizeParallaxIntensity(undefined)).toBe(35);
  });

  it("computes offset from intensity and direction", () => {
    expect(computeParallaxOffset(200, 35, "normal")).toBe(70);
    expect(computeParallaxOffset(200, 35, "reverse")).toBe(-70);
    expect(computeParallaxOffset(100, 0, "normal")).toBe(0);
  });

  it("builds layer geometry from the fixed safety bleed", () => {
    expect(parallaxLayerGeometry()).toEqual({
      topPercent: -10,
      heightPercent: 120,
    });
  });

  it("grows pixel geometry with max travel so 100% intensity stays covered", () => {
    expect(maxParallaxTravelPx(800, 100)).toBe(800);
    expect(maxParallaxTravelPx(800, 50)).toBe(400);
    expect(
      parallaxLayerPixelGeometry({
        viewportHeight: 1000,
        maxTravelPx: 800,
      }),
    ).toEqual({
      topPx: -900,
      heightPx: 2800,
    });
  });
});

describe("pageMarginFromStoredIndex", () => {
  it("maps stored numeric indexes back to margin tokens", () => {
    expect(pageMarginFromStoredIndex(0, "md")).toBe("none");
    expect(pageMarginFromStoredIndex(4, "md")).toBe("xl");
    expect(pageMarginFromStoredIndex(null, "lg")).toBe("lg");
  });

  it("round-trips with pageMarginToStoredIndex", () => {
    expect(pageMarginFromStoredIndex(pageMarginToStoredIndex("sm"), "md")).toBe(
      "sm",
    );
  });
});

describe("routeThemeContentFrameClass", () => {
  it("maps mobile and desktop margins to spacing calc classes", () => {
    expect(
      routeThemeContentFrameClass({
        contentMarginMobile: "none",
        contentMarginDesktop: "xl",
      }),
    ).toBe(
      "flex flex-1 flex-col p-[calc(var(--spacing)*0)] sm:p-[calc(var(--spacing)*20)]",
    );
    expect(
      routeThemeContentFrameClass({
        contentMarginMobile: "md",
        contentMarginDesktop: "lg",
      }),
    ).toBe(
      "flex flex-1 flex-col p-[calc(var(--spacing)*6)] sm:p-[calc(var(--spacing)*15)]",
    );
  });

  it("uses defaults when theme is null", () => {
    expect(routeThemeContentFrameClass(null)).toBe(
      "flex flex-1 flex-col p-[calc(var(--spacing)*6)] sm:p-[calc(var(--spacing)*15)]",
    );
  });
});

describe("routeThemeContentSurfaceTopRadiusClass", () => {
  it("mirrors surface radius on the top edge only", () => {
    expect(
      routeThemeContentSurfaceTopRadiusClass({
        contentMarginMobile: "none",
        contentMarginDesktop: "none",
      }),
    ).toBe("rounded-t-none sm:rounded-t-none");
    expect(
      routeThemeContentSurfaceTopRadiusClass({
        contentMarginMobile: "md",
        contentMarginDesktop: "lg",
      }),
    ).toBe("rounded-t-2xl sm:rounded-t-2xl");
    expect(
      routeThemeContentSurfaceTopRadiusClass({
        contentMarginMobile: "none",
        contentMarginDesktop: "lg",
      }),
    ).toBe("rounded-t-none sm:rounded-t-2xl");
  });
});

describe("routeThemeContentSurfaceRadiusClass", () => {
  it("removes rounded corners when margin is none", () => {
    expect(
      routeThemeContentSurfaceRadiusClass({
        contentMarginMobile: "none",
        contentMarginDesktop: "none",
      }),
    ).toBe("rounded-none sm:rounded-none");
    expect(
      routeThemeContentSurfaceRadiusClass({
        contentMarginMobile: "md",
        contentMarginDesktop: "lg",
      }),
    ).toBe("rounded-2xl sm:rounded-2xl");
    expect(
      routeThemeContentSurfaceRadiusClass({
        contentMarginMobile: "none",
        contentMarginDesktop: "lg",
      }),
    ).toBe("rounded-none sm:rounded-2xl");
  });
});

describe("foreground color", () => {
  it("normalizes invalid values to the brand default", () => {
    expect(normalizeForegroundColor(undefined)).toBe("#002555");
    expect(normalizeForegroundColor("nope")).toBe("#002555");
    expect(normalizeForegroundColor("#abc")).toBe("#abc");
    expect(normalizeForegroundColor("#112233")).toBe("#112233");
  });

  it("does not override semantic foreground tokens", () => {
    expect(
      routeThemeForegroundStyle({ foregroundColor: "#334455" }),
    ).toEqual({});
  });
});

describe("surface color", () => {
  it("normalizes invalid values to white", () => {
    expect(normalizeSurfaceColor(undefined)).toBe("#ffffff");
    expect(normalizeSurfaceColor("bad")).toBe("#ffffff");
  });

  it("builds rgba background for the page container", () => {
    expect(
      routeThemeSurfaceBackgroundStyle({
        surfaceColor: "#ffffff",
        surfaceColorOpacity: 40,
      }),
    ).toEqual({ backgroundColor: "rgba(255, 255, 255, 0.4)" });
  });

  it("surface panel style only sets background, not text tokens", () => {
    expect(
      routeThemeSurfacePanelStyle({
        foregroundColor: "#002555",
        surfaceColor: "#ffffff",
        surfaceColorOpacity: 50,
      } as RouteThemeView),
    ).toEqual({ backgroundColor: "rgba(255, 255, 255, 0.5)" });
  });
});
