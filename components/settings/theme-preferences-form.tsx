"use client";

import { useTranslations } from "next-intl";

import { BrandingMediaSlotEditor } from "@/components/settings/branding-media-slot-editor";
import { SettingsSectionHeading } from "@/components/settings/settings-section-heading";
import type { BrandingSlotConfig } from "@/lib/domain/branding-slots";
import type { ResolvedBrandingSlot } from "@/lib/repos/branding";
import type { MediaAssetRecord } from "@/lib/repos/media";

export interface ThemePreferencesFormProps {
  menuLogo: ResolvedBrandingSlot;
  cartWatermark: ResolvedBrandingSlot;
  onListImages: () => Promise<MediaAssetRecord[]>;
  onUploadImage: (formData: FormData) => Promise<MediaAssetRecord>;
  onSaveSlotMedia: (
    key: "menu_logo" | "cart_watermark",
    mediaId: string | null,
  ) => Promise<void>;
  onSaveSlotConfig: (
    key: "menu_logo" | "cart_watermark",
    config: BrandingSlotConfig,
  ) => Promise<void>;
}

export function ThemePreferencesForm({
  menuLogo,
  cartWatermark,
  onListImages,
  onUploadImage,
  onSaveSlotMedia,
  onSaveSlotConfig,
}: ThemePreferencesFormProps) {
  const t = useTranslations("settings");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <SettingsSectionHeading title={t("preferencesTitle")} />
        <p className="text-sm text-muted-foreground">{t("preferencesHelp")}</p>
      </div>

      <BrandingMediaSlotEditor
        slotKey="menu_logo"
        titleKey="menuLogoLabel"
        savedKey="menuLogoSaved"
        noneKey="menuLogoNone"
        chooseKey="menuLogoChoose"
        removeKey="menuLogoRemove"
        backgroundColorKey="menuLogoBackgroundColor"
        backgroundOpacityKey="menuLogoBackgroundOpacity"
        backgroundOpacityValueKey="menuLogoBackgroundOpacityValue"
        backgroundSavedKey="menuLogoBackgroundSaved"
        initialMediaId={menuLogo.mediaId}
        initialMediaUrl={menuLogo.mediaUrl}
        initialConfig={menuLogo.config}
        supportsBackground
        supportsDisplay={false}
        onListImages={onListImages}
        onUploadImage={onUploadImage}
        onSaveMedia={(mediaId) => onSaveSlotMedia("menu_logo", mediaId)}
        onSaveConfig={(config) => onSaveSlotConfig("menu_logo", config)}
      />

      <BrandingMediaSlotEditor
        slotKey="cart_watermark"
        titleKey="cartWatermarkLabel"
        savedKey="cartWatermarkSaved"
        noneKey="cartWatermarkNone"
        chooseKey="cartWatermarkChoose"
        removeKey="cartWatermarkRemove"
        backgroundColorKey="cartWatermarkBackgroundColor"
        backgroundOpacityKey="cartWatermarkBackgroundOpacity"
        backgroundOpacityValueKey="cartWatermarkBackgroundOpacityValue"
        backgroundSavedKey="cartWatermarkBackgroundSaved"
        displayOpacityKey="cartWatermarkDisplayOpacity"
        displayOpacityValueKey="cartWatermarkDisplayOpacityValue"
        widthPercentKey="cartWatermarkWidthPercent"
        widthPercentValueKey="cartWatermarkWidthPercentValue"
        initialMediaId={cartWatermark.mediaId}
        initialMediaUrl={cartWatermark.mediaUrl}
        initialConfig={cartWatermark.config}
        supportsBackground
        supportsDisplay
        onListImages={onListImages}
        onUploadImage={onUploadImage}
        onSaveMedia={(mediaId) => onSaveSlotMedia("cart_watermark", mediaId)}
        onSaveConfig={(config) => onSaveSlotConfig("cart_watermark", config)}
      />
    </div>
  );
}
