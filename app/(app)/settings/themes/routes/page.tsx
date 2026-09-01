import { ThemeSettingsManager } from "@/components/settings/theme-settings-manager";
import { loadSettingsRouteThemes } from "@/lib/themes/load-settings-route-themes";

import { updateRouteTheme } from "../actions";
import { listLibraryMedia, uploadLibraryMedia } from "../media-actions";

export default async function SettingsThemeRoutesPage() {
  const themes = await loadSettingsRouteThemes();

  async function handleSave(
    documentId: string,
    values: Parameters<typeof updateRouteTheme>[1],
  ): Promise<void> {
    "use server";
    await updateRouteTheme(documentId, values);
  }

  async function handleListImages() {
    "use server";
    const result = await listLibraryMedia({
      mimeFilter: "image",
      category: "route_theme",
      page: 1,
      pageSize: 100,
    });
    return result.items;
  }

  async function handleUploadImage(formData: FormData) {
    "use server";
    formData.set("category", "route_theme");
    return uploadLibraryMedia(formData);
  }

  return (
    <ThemeSettingsManager
      themes={themes}
      onSave={handleSave}
      onListImages={handleListImages}
      onUploadImage={handleUploadImage}
    />
  );
}
