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
  const byKey = new Map(themes.map((theme) => [theme.routeKey, theme]));

  return ROUTE_THEME_KEYS.flatMap((key) => {
    const theme = byKey.get(key);
    if (!theme) return [];
    return [{ ...theme, label: labels[key] ?? theme.label }];
  });
}
