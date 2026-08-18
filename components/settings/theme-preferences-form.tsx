"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { MediaPickerModal } from "@/components/settings/media-picker-modal";
import { SettingsSectionHeading } from "@/components/settings/settings-section-heading";
import { Button } from "@/components/ui/button";
import type { MediaAssetRecord } from "@/lib/repos/media";

export interface ThemePreferencesFormProps {
  initialMenuLogoMediaId: string | null;
  initialMenuLogoUrl: string | null;
  onListImages: () => Promise<MediaAssetRecord[]>;
  onUploadImage: (formData: FormData) => Promise<MediaAssetRecord>;
  onSaveMenuLogo: (mediaId: string | null) => Promise<void>;
}

export function ThemePreferencesForm({
  initialMenuLogoMediaId,
  initialMenuLogoUrl,
  onListImages,
  onUploadImage,
  onSaveMenuLogo,
}: ThemePreferencesFormProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [menuLogoMediaId, setMenuLogoMediaId] = useState(
    initialMenuLogoMediaId,
  );
  const [menuLogoUrl, setMenuLogoUrl] = useState(initialMenuLogoUrl);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const listImages = useCallback(() => onListImages(), [onListImages]);

  function handleConfirm(asset: MediaAssetRecord): void {
    setPickerOpen(false);
    startTransition(async () => {
      setMessage(null);
      try {
        await onSaveMenuLogo(asset.id);
        setMenuLogoMediaId(asset.id);
        setMenuLogoUrl(asset.browserUrl);
        setMessage(t("menuLogoSaved"));
      } catch {
        setMessage(tCommon("errorGeneric"));
      }
    });
  }

  function handleRemove(): void {
    startTransition(async () => {
      setMessage(null);
      try {
        await onSaveMenuLogo(null);
        setMenuLogoMediaId(null);
        setMenuLogoUrl(null);
        setMessage(t("menuLogoSaved"));
      } catch {
        setMessage(tCommon("errorGeneric"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <SettingsSectionHeading title={t("preferencesTitle")} />
        <p className="text-sm text-muted-foreground">{t("preferencesHelp")}</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">{t("menuLogoLabel")}</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {menuLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={menuLogoUrl}
                alt=""
                className="size-full object-contain p-1"
              />
            ) : (
              <span className="px-2 text-center text-[10px] text-muted-foreground">
                {t("menuLogoNone")}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={isPending}
              onClick={() => setPickerOpen(true)}
            >
              {t("menuLogoChoose")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending || !menuLogoMediaId}
              onClick={handleRemove}
            >
              {t("menuLogoRemove")}
            </Button>
          </div>
        </div>
        {message ? (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>

      <MediaPickerModal
        open={pickerOpen}
        selectedId={menuLogoMediaId}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleConfirm}
        onListImages={listImages}
        onUploadImage={onUploadImage}
      />
    </div>
  );
}
