import { ThemePreferencesForm } from "@/components/settings/theme-preferences-form";
import { loadResolvedBrandingAssets } from "@/lib/repos/branding";

import {
  listLibraryMedia,
  updateMenuLogo,
  uploadLibraryMedia,
} from "../media-actions";

export default async function SettingsThemePreferencesPage() {
  const branding = await loadResolvedBrandingAssets();

  async function handleListImages() {
    "use server";
    const result = await listLibraryMedia({
      mimeFilter: "image",
      page: 1,
      pageSize: 100,
    });
    return result.items;
  }

  async function handleUploadImage(formData: FormData) {
    "use server";
    return uploadLibraryMedia(formData);
  }

  async function handleSaveMenuLogo(mediaId: string | null) {
    "use server";
    await updateMenuLogo(mediaId);
  }

  return (
    <ThemePreferencesForm
      initialMenuLogoMediaId={branding.menuLogoMediaId}
      initialMenuLogoUrl={branding.menuLogoUrl}
      onListImages={handleListImages}
      onUploadImage={handleUploadImage}
      onSaveMenuLogo={handleSaveMenuLogo}
    />
  );
}
