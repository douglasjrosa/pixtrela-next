import { ThemePreferencesForm } from "@/components/settings/theme-preferences-form";
import { loadResolvedBrandingAssets } from "@/lib/repos/branding";

import {
  listLibraryMedia,
  updateMenuLogo,
  updateMenuLogoBackground,
  uploadLibraryMedia,
} from "../media-actions";

export default async function SettingsThemePreferencesPage() {
  const branding = await loadResolvedBrandingAssets();

  async function handleListImages() {
    "use server";
    const result = await listLibraryMedia({
      mimeFilter: "image",
      category: "branding",
      page: 1,
      pageSize: 100,
    });
    return result.items;
  }

  async function handleUploadImage(formData: FormData) {
    "use server";
    formData.set("category", "branding");
    return uploadLibraryMedia(formData);
  }

  async function handleSaveMenuLogo(mediaId: string | null) {
    "use server";
    await updateMenuLogo(mediaId);
  }

  async function handleSaveMenuLogoBackground(
    backgroundColor: string | null,
    backgroundColorOpacity: number,
  ) {
    "use server";
    await updateMenuLogoBackground(backgroundColor, backgroundColorOpacity);
  }

  return (
    <ThemePreferencesForm
      initialMenuLogoMediaId={branding.menuLogoMediaId}
      initialMenuLogoUrl={branding.menuLogoUrl}
      initialMenuLogoBackgroundColor={branding.menuLogoBackgroundColor}
      initialMenuLogoBackgroundColorOpacity={
        branding.menuLogoBackgroundColorOpacity
      }
      onListImages={handleListImages}
      onUploadImage={handleUploadImage}
      onSaveMenuLogo={handleSaveMenuLogo}
      onSaveMenuLogoBackground={handleSaveMenuLogoBackground}
    />
  );
}
