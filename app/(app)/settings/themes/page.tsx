import { ThemeSettingsManager } from "@/components/settings/theme-settings-manager";
import { isDrizzleBackend } from "@/lib/db/backend";
import { listRouteThemes as listRouteThemesRepo } from "@/lib/repos/settings";
import { loadRouteThemes } from "@/lib/strapi/route-themes";
import {
  DEFAULT_BACKGROUND_COLOR_OPACITY,
  DEFAULT_BACKGROUND_MOTION,
  DEFAULT_BACKGROUND_POSITION,
  DEFAULT_BACKGROUND_REPEAT,
  DEFAULT_BACKGROUND_SIZE,
  DEFAULT_FOREGROUND_COLOR,
  DEFAULT_PAGE_MARGIN_DESKTOP,
  DEFAULT_PAGE_MARGIN_MOBILE,
  DEFAULT_PARALLAX_BLEED,
  DEFAULT_PARALLAX_DIRECTION,
  DEFAULT_PARALLAX_INTENSITY,
  DEFAULT_SURFACE_COLOR,
  DEFAULT_SURFACE_COLOR_OPACITY,
  isRouteThemeKey,
  normalizeForegroundColor,
  normalizeOpacity,
  normalizeParallaxBleed,
  normalizeParallaxIntensity,
  normalizeSurfaceColor,
  type RouteThemeView,
} from "@/lib/themes/match-route-theme";

import {
  updateRouteTheme,
  uploadRouteThemeImage,
} from "./actions";

async function loadThemes(): Promise<RouteThemeView[]> {
  if (isDrizzleBackend()) {
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
        backgroundImageUrl: null,
        backgroundSize:
          (row.backgroundSize as RouteThemeView["backgroundSize"]) ||
          DEFAULT_BACKGROUND_SIZE,
        backgroundPosition:
          (row.backgroundPosition as RouteThemeView["backgroundPosition"]) ||
          DEFAULT_BACKGROUND_POSITION,
        backgroundRepeat:
          (row.backgroundRepeat as RouteThemeView["backgroundRepeat"]) ||
          DEFAULT_BACKGROUND_REPEAT,
        backgroundMotion:
          (row.backgroundMotion as RouteThemeView["backgroundMotion"]) ||
          DEFAULT_BACKGROUND_MOTION,
        parallaxIntensity: normalizeParallaxIntensity(
          row.parallaxIntensity ?? DEFAULT_PARALLAX_INTENSITY,
        ),
        parallaxDirection:
          (row.parallaxDirection as RouteThemeView["parallaxDirection"]) ||
          DEFAULT_PARALLAX_DIRECTION,
        parallaxBleed: normalizeParallaxBleed(
          row.parallaxBleed ?? DEFAULT_PARALLAX_BLEED,
        ),
        contentMarginMobile: DEFAULT_PAGE_MARGIN_MOBILE,
        contentMarginDesktop: DEFAULT_PAGE_MARGIN_DESKTOP,
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
  }

  return loadRouteThemes();
}

export default async function SettingsThemesPage() {
  const themes = await loadThemes();

  async function handleSave(
    documentId: string,
    values: Parameters<typeof updateRouteTheme>[1],
  ): Promise<void> {
    "use server";
    await updateRouteTheme(documentId, values);
  }

  async function handleUpload(formData: FormData): Promise<number> {
    "use server";
    return uploadRouteThemeImage(formData);
  }

  return (
    <ThemeSettingsManager
      themes={themes}
      onSave={handleSave}
      onUploadImage={handleUpload}
    />
  );
}
