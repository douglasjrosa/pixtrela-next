import { ThemeSettingsManager } from "@/components/settings/theme-settings-manager";
import { loadSettingsRouteThemes } from "@/lib/themes/load-settings-route-themes";

import { updateRouteTheme, uploadRouteThemeImage } from "../actions";

export default async function SettingsThemeRoutesPage() {
  const themes = await loadSettingsRouteThemes();

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
