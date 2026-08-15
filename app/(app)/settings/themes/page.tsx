import { getTranslations } from "next-intl/server";

import { ThemeSettingsManager } from "@/components/settings/theme-settings-manager";
import { ensureRouteThemes } from "@/lib/repos/settings";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";
import {
  ROUTE_THEME_KEYS,
  type RouteThemeKey,
  type RouteThemeView,
} from "@/lib/themes/match-route-theme";

import {
  updateRouteTheme,
  uploadRouteThemeImage,
} from "./actions";

async function loadThemes(): Promise<RouteThemeView[]> {
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

export default async function SettingsThemesPage() {
  const themes = await loadThemes();

  async function handleSave(
    documentId: string,
    values: Parameters<typeof updateRouteTheme>[1],
  ): Promise<void> {
    "use server";
    await updateRouteTheme(documentId, values);
  }

  async function handleUpload(
    formData: FormData,
  ): Promise<number | string> {
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
