import { ThemeSettingsManager } from "@/components/settings/theme-settings-manager";
import { loadRouteThemes } from "@/lib/strapi/route-themes";

import {
  updateRouteTheme,
  uploadRouteThemeImage,
} from "./actions";

export default async function SettingsThemesPage() {
  const themes = await loadRouteThemes();

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
