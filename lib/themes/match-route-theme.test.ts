import { describe, expect, it } from "vitest";

import {
  computeParallaxOffset,
  hasVisibleColorOverlay,
  hexToRgba,
  matchRouteTheme,
  normalizeOpacity,
  normalizeParallaxBleed,
  normalizeParallaxIntensity,
  parallaxLayerGeometry,
  resolveRouteThemeKey,
  routeThemeContentFrameClass,
  routeThemeContentSurfaceRadiusClass,
  routeThemeForegroundStyle,
  routeThemeSurfaceBackgroundStyle,
  normalizeForegroundColor,
  normalizeSurfaceColor,
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
  parallaxBleed: 20,
  contentMarginMobile: "md" as const,
  contentMarginDesktop: "lg" as const,
  foregroundColor: "#002555",
  surfaceColor: "#ffffff",
  surfaceColorOpacity: 100,
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
    parallaxBleed: 20,
    contentMarginMobile: "md",
    contentMarginDesktop: "lg",
    foregroundColor: "#002555",
    surfaceColor: "#ffffff",
    surfaceColorOpacity: 100,
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
    expect(resolveRouteThemeKey("/kiosk/user1")).toBe("kiosk");
    expect(resolveRouteThemeKey("/settings/themes")).toBe("settings");
  });

  it("maps colaborator documentId paths", () => {
    expect(resolveRouteThemeKey("/abcDocumentId")).toBe("colaborator");
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
        "linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), url(https://cdn.example/bg.png)",
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
      backgroundImage: "url(https://cdn.example/bg.png)",
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
      backgroundImage: "url(https://cdn.example/bg.png)",
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
  it("clamps intensity and bleed", () => {
    expect(normalizeParallaxIntensity(-5)).toBe(0);
    expect(normalizeParallaxIntensity(200)).toBe(100);
    expect(normalizeParallaxIntensity(undefined)).toBe(35);
    expect(normalizeParallaxBleed(5)).toBe(10);
    expect(normalizeParallaxBleed(90)).toBe(40);
  });

  it("computes offset from intensity and direction", () => {
    expect(computeParallaxOffset(200, 35, "normal")).toBe(70);
    expect(computeParallaxOffset(200, 35, "reverse")).toBe(-70);
    expect(computeParallaxOffset(100, 0, "normal")).toBe(0);
  });

  it("builds layer geometry from bleed", () => {
    expect(parallaxLayerGeometry(20)).toEqual({
      topPercent: -20,
      heightPercent: 140,
    });
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

  it("exposes CSS variables for the content surface", () => {
    expect(
      routeThemeForegroundStyle({ foregroundColor: "#334455" }),
    ).toEqual({
      color: "#334455",
      "--foreground": "#334455",
      "--card-foreground": "#334455",
      "--popover-foreground": "#334455",
    });
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
});
