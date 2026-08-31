import { ThemePreferencesForm } from "@/components/settings/theme-preferences-form";
import type { BrandingSlotConfig } from "@/lib/domain/branding-slots";
import { loadResolvedBranding } from "@/lib/repos/branding";

import {
  listLibraryMedia,
  updateBrandingSlotConfig,
  updateBrandingSlotMedia,
  uploadLibraryMedia,
} from "../media-actions";

export default async function SettingsThemePreferencesPage() {
  const branding = await loadResolvedBranding();

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

  async function handleSaveSlotMedia(
    key: "menu_logo" | "cart_watermark",
    mediaId: string | null,
  ) {
    "use server";
    await updateBrandingSlotMedia(key, mediaId);
  }

  async function handleSaveSlotConfig(
    key: "menu_logo" | "cart_watermark",
    config: BrandingSlotConfig,
  ) {
    "use server";
    await updateBrandingSlotConfig(key, config);
  }

  return (
    <ThemePreferencesForm
      menuLogo={branding.menu_logo}
      cartWatermark={branding.cart_watermark}
      onListImages={handleListImages}
      onUploadImage={handleUploadImage}
      onSaveSlotMedia={handleSaveSlotMedia}
      onSaveSlotConfig={handleSaveSlotConfig}
    />
  );
}
