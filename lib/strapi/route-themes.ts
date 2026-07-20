import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
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
  DEFAULT_PARALLAX_BLEED,
  DEFAULT_PARALLAX_DIRECTION,
  DEFAULT_PARALLAX_INTENSITY,
  DEFAULT_FOREGROUND_COLOR,
  DEFAULT_SURFACE_COLOR,
  DEFAULT_SURFACE_COLOR_OPACITY,
  isRouteThemeKey,
  normalizeForegroundColor,
  normalizeOpacity,
  normalizeParallaxBleed,
  normalizeParallaxIntensity,
  normalizeSurfaceColor,
  PAGE_MARGINS,
  PARALLAX_DIRECTIONS,
  type BackgroundMotion,
  type BackgroundPosition,
  type BackgroundRepeat,
  type BackgroundSize,
  type PageMargin,
  type ParallaxDirection,
  type RouteThemeKey,
  type RouteThemeView,
} from "@/lib/themes/match-route-theme";

interface StrapiList<T> {
  data: T[];
}

interface RouteThemeEntity {
  documentId: string;
  routeKey: string;
  label: string;
  backgroundColor?: string | null;
  backgroundColorOpacity?: number | null;
  backgroundSize?: string | null;
  backgroundPosition?: string | null;
  backgroundRepeat?: string | null;
  backgroundMotion?: string | null;
  parallaxIntensity?: number | null;
  parallaxDirection?: string | null;
  parallaxBleed?: number | null;
  contentMarginMobile?: string | null;
  contentMarginDesktop?: string | null;
  foregroundColor?: string | null;
  surfaceColor?: string | null;
  surfaceColorOpacity?: number | null;
  backgroundImage?: { url?: string } | null;
}

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

function mapTheme(entity: RouteThemeEntity): RouteThemeView | null {
  if (!isRouteThemeKey(entity.routeKey)) return null;
  return {
    documentId: entity.documentId,
    routeKey: entity.routeKey as RouteThemeKey,
    label: entity.label,
    backgroundColor: entity.backgroundColor ?? null,
    backgroundColorOpacity: normalizeOpacity(
      entity.backgroundColorOpacity ?? DEFAULT_BACKGROUND_COLOR_OPACITY,
    ),
    backgroundImageUrl: resolveStrapiMediaUrl(entity.backgroundImage?.url),
    backgroundSize: asEnum(
      entity.backgroundSize,
      BACKGROUND_SIZES,
      DEFAULT_BACKGROUND_SIZE,
    ) as BackgroundSize,
    backgroundPosition: asEnum(
      entity.backgroundPosition,
      BACKGROUND_POSITIONS,
      DEFAULT_BACKGROUND_POSITION,
    ) as BackgroundPosition,
    backgroundRepeat: asEnum(
      entity.backgroundRepeat,
      BACKGROUND_REPEATS,
      DEFAULT_BACKGROUND_REPEAT,
    ) as BackgroundRepeat,
    backgroundMotion: asEnum(
      entity.backgroundMotion,
      BACKGROUND_MOTIONS,
      DEFAULT_BACKGROUND_MOTION,
    ) as BackgroundMotion,
    parallaxIntensity: normalizeParallaxIntensity(
      entity.parallaxIntensity ?? DEFAULT_PARALLAX_INTENSITY,
    ),
    parallaxDirection: asEnum(
      entity.parallaxDirection,
      PARALLAX_DIRECTIONS,
      DEFAULT_PARALLAX_DIRECTION,
    ) as ParallaxDirection,
    parallaxBleed: normalizeParallaxBleed(
      entity.parallaxBleed ?? DEFAULT_PARALLAX_BLEED,
    ),
    contentMarginMobile: asEnum(
      entity.contentMarginMobile,
      PAGE_MARGINS,
      DEFAULT_PAGE_MARGIN_MOBILE,
    ) as PageMargin,
    contentMarginDesktop: asEnum(
      entity.contentMarginDesktop,
      PAGE_MARGINS,
      DEFAULT_PAGE_MARGIN_DESKTOP,
    ) as PageMargin,
    foregroundColor: normalizeForegroundColor(
      entity.foregroundColor ?? DEFAULT_FOREGROUND_COLOR,
    ),
    surfaceColor: normalizeSurfaceColor(
      entity.surfaceColor ?? DEFAULT_SURFACE_COLOR,
    ),
    surfaceColorOpacity: normalizeOpacity(
      entity.surfaceColorOpacity ?? DEFAULT_SURFACE_COLOR_OPACITY,
    ),
  };
}

export async function loadRouteThemes(): Promise<RouteThemeView[]> {
  try {
    const res = await strapiFetch<StrapiList<RouteThemeEntity>>(
      "/route-themes",
      {
        requireAuth: false,
        strapiCache: { tags: [STRAPI_TAGS.routeThemes], revalidate: 60 },
      },
      {
        fields: [
          "documentId",
          "routeKey",
          "label",
          "backgroundColor",
          "backgroundColorOpacity",
          "backgroundSize",
          "backgroundPosition",
          "backgroundRepeat",
          "backgroundMotion",
          "parallaxIntensity",
          "parallaxDirection",
          "parallaxBleed",
          "contentMarginMobile",
          "contentMarginDesktop",
          "foregroundColor",
          "surfaceColor",
          "surfaceColorOpacity",
        ],
        populate: { backgroundImage: { fields: ["url"] } },
        pagination: { pageSize: 50 },
        sort: "label:asc",
      },
    );
    return res.data
      .map(mapTheme)
      .filter((theme): theme is RouteThemeView => theme !== null);
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
