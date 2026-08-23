import { getTranslations } from "next-intl/server";

import { ensureRouteThemes } from "@/lib/repos/settings";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";
import {
  ROUTE_THEME_KEYS,
  type RouteThemeKey,
  type RouteThemeView,
} from "@/lib/themes/match-route-theme";

export async function loadSettingsRouteThemes(): Promise<RouteThemeView[]> {
  const t = await getTranslations("settings.themeRoutes");
  const labels = Object.fromEntries(
    ROUTE_THEME_KEYS.map((key) => [key, t(key)]),
  ) as Record<RouteThemeKey, string>;
  await ensureRouteThemes(labels);

  const themes = await loadRouteThemes();
  return themes.map((theme) => ({
    ...theme,
    label: labels[theme.routeKey] ?? theme.label,
  }));
}
