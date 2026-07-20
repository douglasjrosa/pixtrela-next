export const ROUTE_THEME_KEYS = [
  "login",
  "staff-home",
  "board",
  "tasks",
  "templates",
  "teams",
  "awards",
  "users",
  "settings",
  "colaborator",
  "kiosk",
] as const;

export type RouteThemeKey = (typeof ROUTE_THEME_KEYS)[number];

export function isRouteThemeKey(value: string): value is RouteThemeKey {
  return (ROUTE_THEME_KEYS as readonly string[]).includes(value);
}

export const BACKGROUND_SIZES = ["cover", "contain", "auto"] as const;
export type BackgroundSize = (typeof BACKGROUND_SIZES)[number];

export const BACKGROUND_POSITIONS = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
] as const;
export type BackgroundPosition = (typeof BACKGROUND_POSITIONS)[number];

export const BACKGROUND_REPEATS = [
  "no-repeat",
  "repeat",
  "repeat-x",
  "repeat-y",
] as const;
export type BackgroundRepeat = (typeof BACKGROUND_REPEATS)[number];

export const BACKGROUND_MOTIONS = ["scroll", "fixed", "parallax"] as const;
export type BackgroundMotion = (typeof BACKGROUND_MOTIONS)[number];

export const DEFAULT_BACKGROUND_SIZE: BackgroundSize = "cover";
export const DEFAULT_BACKGROUND_POSITION: BackgroundPosition = "center";
export const DEFAULT_BACKGROUND_REPEAT: BackgroundRepeat = "no-repeat";
export const DEFAULT_BACKGROUND_MOTION: BackgroundMotion = "scroll";
export const DEFAULT_BACKGROUND_COLOR_OPACITY = 100;
export const FULLY_TRANSPARENT_OPACITY = 0;

export const PARALLAX_DIRECTIONS = ["normal", "reverse"] as const;
export type ParallaxDirection = (typeof PARALLAX_DIRECTIONS)[number];

export const DEFAULT_PARALLAX_INTENSITY = 35;
export const MIN_PARALLAX_INTENSITY = 0;
export const MAX_PARALLAX_INTENSITY = 100;
export const DEFAULT_PARALLAX_DIRECTION: ParallaxDirection = "normal";
export const DEFAULT_PARALLAX_BLEED = 20;
export const MIN_PARALLAX_BLEED = 10;
export const MAX_PARALLAX_BLEED = 40;

/** @deprecated Prefer parallaxScrollFactor(intensity). */
export const PARALLAX_SCROLL_FACTOR = DEFAULT_PARALLAX_INTENSITY / 100;

export const PAGE_MARGINS = ["none", "sm", "md", "lg", "xl"] as const;
export type PageMargin = (typeof PAGE_MARGINS)[number];

/** Mobile default matches previous frame padding (p-3). */
export const DEFAULT_PAGE_MARGIN_MOBILE: PageMargin = "md";
/** Desktop default: grandes (spacing * 15). */
export const DEFAULT_PAGE_MARGIN_DESKTOP: PageMargin = "lg";

/** Default app ink / font color. */
export const DEFAULT_FOREGROUND_COLOR = "#002555";
/** Default rounded page container fill. */
export const DEFAULT_SURFACE_COLOR = "#ffffff";
export const DEFAULT_SURFACE_COLOR_OPACITY = 100;

const FOREGROUND_HEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

/** Mobile padding: none/4/6/8/10 × --spacing. */
const PAGE_MARGIN_MOBILE_CLASS: Record<PageMargin, string> = {
  none: "p-[calc(var(--spacing)*0)]",
  sm: "p-[calc(var(--spacing)*4)]",
  md: "p-[calc(var(--spacing)*6)]",
  lg: "p-[calc(var(--spacing)*8)]",
  xl: "p-[calc(var(--spacing)*10)]",
};

/** Desktop padding (sm:): none/5/10/15/20 × --spacing. */
const PAGE_MARGIN_DESKTOP_CLASS: Record<PageMargin, string> = {
  none: "sm:p-[calc(var(--spacing)*0)]",
  sm: "sm:p-[calc(var(--spacing)*5)]",
  md: "sm:p-[calc(var(--spacing)*10)]",
  lg: "sm:p-[calc(var(--spacing)*15)]",
  xl: "sm:p-[calc(var(--spacing)*20)]",
};

export interface RouteThemeView {
  documentId: string;
  routeKey: RouteThemeKey;
  label: string;
  backgroundColor: string | null;
  backgroundColorOpacity: number;
  backgroundImageUrl: string | null;
  backgroundSize: BackgroundSize;
  backgroundPosition: BackgroundPosition;
  backgroundRepeat: BackgroundRepeat;
  backgroundMotion: BackgroundMotion;
  parallaxIntensity: number;
  parallaxDirection: ParallaxDirection;
  parallaxBleed: number;
  contentMarginMobile: PageMargin;
  contentMarginDesktop: PageMargin;
  foregroundColor: string;
  surfaceColor: string;
  surfaceColorOpacity: number;
}

/** Static path prefixes ordered longest-first for matching. */
const PREFIX_RULES: { prefix: string; key: RouteThemeKey }[] = [
  { prefix: "/settings", key: "settings" },
  { prefix: "/templates", key: "templates" },
  { prefix: "/board", key: "board" },
  { prefix: "/tasks", key: "tasks" },
  { prefix: "/teams", key: "teams" },
  { prefix: "/awards", key: "awards" },
  { prefix: "/users", key: "users" },
  { prefix: "/kiosk", key: "kiosk" },
  { prefix: "/login", key: "login" },
];

const RESERVED_TOP_SEGMENTS = new Set([
  "login",
  "kiosk",
  "board",
  "tasks",
  "templates",
  "teams",
  "awards",
  "users",
  "settings",
  "balance",
  "exchange",
  "api",
  "serwist",
]);

export function resolveRouteThemeKey(pathname: string): RouteThemeKey | null {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  if (normalized === "/" || normalized === "") {
    return "staff-home";
  }

  for (const rule of PREFIX_RULES) {
    if (
      normalized === rule.prefix ||
      normalized.startsWith(`${rule.prefix}/`)
    ) {
      return rule.key;
    }
  }

  const segment = normalized.split("/").filter(Boolean)[0];
  if (segment && !RESERVED_TOP_SEGMENTS.has(segment)) {
    return "colaborator";
  }

  return null;
}

export function matchRouteTheme(
  pathname: string,
  themes: RouteThemeView[],
): RouteThemeView | null {
  const key = resolveRouteThemeKey(pathname);
  if (!key) return null;
  return themes.find((theme) => theme.routeKey === key) ?? null;
}

/**
 * Outer content frame padding (mobile base + sm: desktop).
 * Keeps the route theme visible around the opaque content surface.
 */
export function routeThemeContentFrameClass(
  theme: Pick<
    RouteThemeView,
    "contentMarginMobile" | "contentMarginDesktop"
  > | null,
): string {
  const mobile = theme?.contentMarginMobile ?? DEFAULT_PAGE_MARGIN_MOBILE;
  const desktop = theme?.contentMarginDesktop ?? DEFAULT_PAGE_MARGIN_DESKTOP;
  return [
    "flex flex-1 flex-col",
    PAGE_MARGIN_MOBILE_CLASS[mobile],
    PAGE_MARGIN_DESKTOP_CLASS[desktop],
  ].join(" ");
}

/**
 * Corner radius for the content surface: flush (none) removes rounded corners.
 */
export function routeThemeContentSurfaceRadiusClass(
  theme: Pick<
    RouteThemeView,
    "contentMarginMobile" | "contentMarginDesktop"
  > | null,
): string {
  const mobile = theme?.contentMarginMobile ?? DEFAULT_PAGE_MARGIN_MOBILE;
  const desktop = theme?.contentMarginDesktop ?? DEFAULT_PAGE_MARGIN_DESKTOP;
  return [
    mobile === "none" ? "rounded-none" : "rounded-2xl",
    desktop === "none" ? "sm:rounded-none" : "sm:rounded-2xl",
  ].join(" ");
}

export function normalizeForegroundColor(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim() ?? "";
  if (FOREGROUND_HEX.test(trimmed)) return trimmed;
  return DEFAULT_FOREGROUND_COLOR;
}

/**
 * Overrides text tokens on a content surface for the matched route theme.
 */
export function routeThemeForegroundStyle(
  theme: Pick<RouteThemeView, "foregroundColor"> | null,
): {
  color: string;
  ["--foreground"]: string;
  ["--card-foreground"]: string;
  ["--popover-foreground"]: string;
} {
  const color = normalizeForegroundColor(theme?.foregroundColor);
  return {
    color,
    "--foreground": color,
    "--card-foreground": color,
    "--popover-foreground": color,
  };
}

export function normalizeSurfaceColor(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim() ?? "";
  if (FOREGROUND_HEX.test(trimmed)) return trimmed;
  return DEFAULT_SURFACE_COLOR;
}

/** Fill color for the rounded page container (supports transparency). */
export function routeThemeSurfaceBackgroundStyle(
  theme: Pick<RouteThemeView, "surfaceColor" | "surfaceColorOpacity"> | null,
): { backgroundColor: string } {
  const color = normalizeSurfaceColor(theme?.surfaceColor);
  const opacity = normalizeOpacity(
    theme?.surfaceColorOpacity ?? DEFAULT_SURFACE_COLOR_OPACITY,
  );
  return {
    backgroundColor: hexToRgba(color, opacity) ?? color,
  };
}

/** Foreground + surface fill for the rounded page container. */
export function routeThemeSurfacePanelStyle(
  theme: RouteThemeView | null,
): {
  color: string;
  backgroundColor: string;
  ["--foreground"]: string;
  ["--card-foreground"]: string;
  ["--popover-foreground"]: string;
} {
  return {
    ...routeThemeForegroundStyle(theme),
    ...routeThemeSurfaceBackgroundStyle(theme),
  };
}

export function normalizeOpacity(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_BACKGROUND_COLOR_OPACITY;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

function clampInt(
  value: number | null | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function normalizeParallaxIntensity(
  value: number | null | undefined,
): number {
  return clampInt(
    value,
    MIN_PARALLAX_INTENSITY,
    MAX_PARALLAX_INTENSITY,
    DEFAULT_PARALLAX_INTENSITY,
  );
}

export function normalizeParallaxBleed(
  value: number | null | undefined,
): number {
  return clampInt(
    value,
    MIN_PARALLAX_BLEED,
    MAX_PARALLAX_BLEED,
    DEFAULT_PARALLAX_BLEED,
  );
}

/** Maps 0–100 intensity to a scroll multiplier (0–1). */
export function parallaxScrollFactor(intensity: number): number {
  return normalizeParallaxIntensity(intensity) / 100;
}

export function computeParallaxOffset(
  scrollY: number,
  intensity: number,
  direction: ParallaxDirection,
): number {
  const delta = scrollY * parallaxScrollFactor(intensity);
  return direction === "reverse" ? -delta : delta;
}

/** Extra vertical room so the image can travel without showing gaps. */
export function parallaxLayerGeometry(bleedPercent: number): {
  topPercent: number;
  heightPercent: number;
} {
  const bleed = normalizeParallaxBleed(bleedPercent);
  return {
    topPercent: -bleed,
    heightPercent: 100 + bleed * 2,
  };
}

export function hasVisibleColorOverlay(theme: RouteThemeView): boolean {
  if (!theme.backgroundColor) return false;
  return normalizeOpacity(theme.backgroundColorOpacity) > FULLY_TRANSPARENT_OPACITY;
}

/** Parses #RGB / #RRGGBB into rgba() with the given opacity percent. */
export function hexToRgba(hex: string, opacityPercent: number): string | null {
  const raw = hex.trim();
  const short = /^#([0-9A-Fa-f]{3})$/.exec(raw);
  const long = /^#([0-9A-Fa-f]{6})$/.exec(raw);
  let r = 0;
  let g = 0;
  let b = 0;
  if (short) {
    const [rs, gs, bs] = short[1].split("");
    r = Number.parseInt(`${rs}${rs}`, 16);
    g = Number.parseInt(`${gs}${gs}`, 16);
    b = Number.parseInt(`${bs}${bs}`, 16);
  } else if (long) {
    r = Number.parseInt(long[1].slice(0, 2), 16);
    g = Number.parseInt(long[1].slice(2, 4), 16);
    b = Number.parseInt(long[1].slice(4, 6), 16);
  } else {
    return null;
  }
  const alpha = normalizeOpacity(opacityPercent) / 100;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function colorOverlayGradient(theme: RouteThemeView): string | null {
  if (!theme.backgroundColor) return null;
  const opacity = normalizeOpacity(theme.backgroundColorOpacity);
  if (opacity === FULLY_TRANSPARENT_OPACITY) return null;
  const rgba = hexToRgba(theme.backgroundColor, opacity);
  if (!rgba) return null;
  return `linear-gradient(${rgba}, ${rgba})`;
}

/**
 * Single-element layered background: color overlay (first = on top) then image.
 */
export function routeThemeLayeredStyle(theme: RouteThemeView | null): {
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundAttachment?: string;
  backgroundColor?: string;
} {
  if (!theme) return {};

  const size = theme.backgroundSize || DEFAULT_BACKGROUND_SIZE;
  const position = theme.backgroundPosition || DEFAULT_BACKGROUND_POSITION;
  const repeat = theme.backgroundRepeat || DEFAULT_BACKGROUND_REPEAT;
  const motion = theme.backgroundMotion || DEFAULT_BACKGROUND_MOTION;
  const colorLayer = colorOverlayGradient(theme);
  const imageLayer = theme.backgroundImageUrl
    ? `url(${theme.backgroundImageUrl})`
    : null;
  const attachment =
    motion === "fixed" ? "fixed" : motion === "parallax" ? "scroll" : "scroll";

  if (imageLayer && colorLayer) {
    return {
      backgroundImage: `${colorLayer}, ${imageLayer}`,
      backgroundSize: `auto, ${size}`,
      backgroundPosition: `center, ${position}`,
      backgroundRepeat: `no-repeat, ${repeat}`,
      backgroundAttachment: `${attachment}, ${attachment}`,
    };
  }

  if (imageLayer) {
    return {
      backgroundImage: imageLayer,
      backgroundSize: size,
      backgroundPosition: position,
      backgroundRepeat: repeat,
      backgroundAttachment: attachment,
    };
  }

  if (colorLayer && theme.backgroundColor) {
    const rgba = hexToRgba(
      theme.backgroundColor,
      normalizeOpacity(theme.backgroundColorOpacity),
    );
    return { backgroundColor: rgba ?? theme.backgroundColor };
  }

  return {};
}

/** Image-only styles for the parallax layer (color is a separate overlay). */
export function routeThemeImageOnlyStyle(theme: RouteThemeView | null): {
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundAttachment?: string;
} {
  if (!theme?.backgroundImageUrl) return {};
  const size = theme.backgroundSize || DEFAULT_BACKGROUND_SIZE;
  const position = theme.backgroundPosition || DEFAULT_BACKGROUND_POSITION;
  const repeat = theme.backgroundRepeat || DEFAULT_BACKGROUND_REPEAT;
  const motion = theme.backgroundMotion || DEFAULT_BACKGROUND_MOTION;
  return {
    backgroundImage: `url(${theme.backgroundImageUrl})`,
    backgroundSize: size,
    backgroundPosition: position,
    backgroundRepeat: repeat,
    backgroundAttachment: motion === "fixed" ? "fixed" : "scroll",
  };
}

export function routeThemeColorOverlayRgba(
  theme: RouteThemeView | null,
): string | null {
  if (!theme?.backgroundColor) return null;
  const opacity = normalizeOpacity(theme.backgroundColorOpacity);
  if (opacity === FULLY_TRANSPARENT_OPACITY) return null;
  return hexToRgba(theme.backgroundColor, opacity);
}

export function routeThemeImageStyle(theme: RouteThemeView | null): {
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
} {
  const layered = routeThemeLayeredStyle(theme);
  if (!theme?.backgroundImageUrl) return {};
  return {
    backgroundImage: layered.backgroundImage,
    backgroundSize: layered.backgroundSize,
    backgroundPosition: layered.backgroundPosition,
    backgroundRepeat: layered.backgroundRepeat,
  };
}

export function routeThemeOverlayStyle(theme: RouteThemeView | null): {
  backgroundColor?: string;
  opacity?: number;
} {
  if (!theme?.backgroundColor) return {};
  const opacity = normalizeOpacity(theme.backgroundColorOpacity);
  if (opacity === FULLY_TRANSPARENT_OPACITY) return {};
  return {
    backgroundColor: theme.backgroundColor,
    opacity: opacity / 100,
  };
}

/** @deprecated Prefer routeThemeLayeredStyle. */
export function routeThemeBackgroundStyle(theme: RouteThemeView | null): {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
} {
  return routeThemeLayeredStyle(theme);
}
