import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listRouteThemes as listRouteThemesRepo } from "@/lib/repos/settings";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import {
  BACKGROUND_MOTIONS,
  BACKGROUND_POSITIONS,
  BACKGROUND_REPEATS,
  BACKGROUND_SIZES,
  DEFAULT_BACKGROUND_COLOR_OPACITY,
  DEFAULT_BACKGROUND_MOTION,
  DEFAULT_BACKGROUND_POSITION,
  DEFAULT_BACKGROUND_REPEAT,
  DEFAULT_BACKGROUND_SIZE,
  DEFAULT_PAGE_MARGIN_DESKTOP,
  DEFAULT_PAGE_MARGIN_MOBILE,
  DEFAULT_PARALLAX_DIRECTION,
  DEFAULT_PARALLAX_INTENSITY,
  DEFAULT_FOREGROUND_COLOR,
  DEFAULT_SURFACE_COLOR,
  DEFAULT_SURFACE_COLOR_OPACITY,
  isRouteThemeKey,
  normalizeForegroundColor,
  normalizeOpacity,
  normalizeParallaxIntensity,
  normalizeSurfaceColor,
  pageMarginFromStoredIndex,
  PARALLAX_DIRECTIONS,
  type BackgroundMotion,
  type BackgroundPosition,
  type BackgroundRepeat,
  type BackgroundSize,
  type ParallaxDirection,
  type RouteThemeView,
} from "@/lib/themes/match-route-theme";

function asEnum<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  if (value && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

export async function loadRouteThemes(): Promise<RouteThemeView[]> {
  try {
    const rows = await listRouteThemesRepo();
    const themes: RouteThemeView[] = [];
    for (const row of rows) {
      if (!isRouteThemeKey(row.routeKey)) continue;
      themes.push({
        documentId: row.id,
        routeKey: row.routeKey,
        label: row.label,
        backgroundColor: row.backgroundColor ?? null,
        backgroundColorOpacity: normalizeOpacity(
          row.backgroundColorOpacity ?? DEFAULT_BACKGROUND_COLOR_OPACITY,
        ),
        backgroundImageUrl: toBrowserMediaUrl(row.backgroundImageUrl),
        backgroundSize: asEnum(
          row.backgroundSize,
          BACKGROUND_SIZES,
          DEFAULT_BACKGROUND_SIZE,
        ) as BackgroundSize,
        backgroundPosition: asEnum(
          row.backgroundPosition,
          BACKGROUND_POSITIONS,
          DEFAULT_BACKGROUND_POSITION,
        ) as BackgroundPosition,
        backgroundRepeat: asEnum(
          row.backgroundRepeat,
          BACKGROUND_REPEATS,
          DEFAULT_BACKGROUND_REPEAT,
        ) as BackgroundRepeat,
        backgroundMotion: asEnum(
          row.backgroundMotion,
          BACKGROUND_MOTIONS,
          DEFAULT_BACKGROUND_MOTION,
        ) as BackgroundMotion,
        parallaxIntensity: normalizeParallaxIntensity(
          row.parallaxIntensity ?? DEFAULT_PARALLAX_INTENSITY,
        ),
        parallaxDirection: asEnum(
          row.parallaxDirection,
          PARALLAX_DIRECTIONS,
          DEFAULT_PARALLAX_DIRECTION,
        ) as ParallaxDirection,
        contentMarginMobile: pageMarginFromStoredIndex(
          row.contentMarginMobile,
          DEFAULT_PAGE_MARGIN_MOBILE,
        ),
        contentMarginDesktop: pageMarginFromStoredIndex(
          row.contentMarginDesktop,
          DEFAULT_PAGE_MARGIN_DESKTOP,
        ),
        foregroundColor: normalizeForegroundColor(
          row.foregroundColor ?? DEFAULT_FOREGROUND_COLOR,
        ),
        surfaceColor: normalizeSurfaceColor(
          row.surfaceColor ?? DEFAULT_SURFACE_COLOR,
        ),
        surfaceColorOpacity: normalizeOpacity(
          row.surfaceColorOpacity ?? DEFAULT_SURFACE_COLOR_OPACITY,
        ),
      });
    }
    return themes;
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
