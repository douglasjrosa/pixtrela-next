"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { MediaPickerModal } from "@/components/settings/media-picker-modal";
import { SettingsSectionHeading } from "@/components/settings/settings-section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MediaAssetRecord } from "@/lib/repos/media";
import {
  DEFAULT_BACKGROUND_COLOR_OPACITY,
  FULLY_TRANSPARENT_OPACITY,
} from "@/lib/themes/match-route-theme";
import { resolveMenuLogoBackgroundStyle } from "@/lib/themes/menu-logo-background";

export interface ThemePreferencesFormProps {
  initialMenuLogoMediaId: string | null;
  initialMenuLogoUrl: string | null;
  initialMenuLogoBackgroundColor: string | null;
  initialMenuLogoBackgroundColorOpacity: number;
  onListImages: () => Promise<MediaAssetRecord[]>;
  onUploadImage: (formData: FormData) => Promise<MediaAssetRecord>;
  onSaveMenuLogo: (mediaId: string | null) => Promise<void>;
  onSaveMenuLogoBackground: (
    backgroundColor: string | null,
    backgroundColorOpacity: number,
  ) => Promise<void>;
}

export function ThemePreferencesForm({
  initialMenuLogoMediaId,
  initialMenuLogoUrl,
  initialMenuLogoBackgroundColor,
  initialMenuLogoBackgroundColorOpacity,
  onListImages,
  onUploadImage,
  onSaveMenuLogo,
  onSaveMenuLogoBackground,
}: ThemePreferencesFormProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [menuLogoMediaId, setMenuLogoMediaId] = useState(
    initialMenuLogoMediaId,
  );
  const [menuLogoUrl, setMenuLogoUrl] = useState(initialMenuLogoUrl);
  const [backgroundColor, setBackgroundColor] = useState(
    initialMenuLogoBackgroundColor ?? "#ffffff",
  );
  const [backgroundOpacity, setBackgroundOpacity] = useState(
    initialMenuLogoBackgroundColorOpacity,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const listImages = useCallback(() => onListImages(), [onListImages]);
  const previewBackground = resolveMenuLogoBackgroundStyle(
    backgroundColor,
    backgroundOpacity,
  );

  function saveBackground(
    nextColor: string,
    nextOpacity: number,
    successMessage: string,
  ): void {
    startTransition(async () => {
      setMessage(null);
      try {
        await onSaveMenuLogoBackground(
          nextOpacity === FULLY_TRANSPARENT_OPACITY ? null : nextColor,
          nextOpacity,
        );
        setMessage(successMessage);
      } catch {
        setMessage(tCommon("errorGeneric"));
      }
    });
  }

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
        <div className="flex flex-wrap items-start gap-4">
          <div
            className="flex size-16 items-center justify-center overflow-hidden rounded-md border p-1"
            style={{
              backgroundColor: previewBackground ?? undefined,
            }}
          >
            {menuLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={menuLogoUrl}
                alt=""
                className="size-full object-contain"
              />
            ) : (
              <span className="px-2 text-center text-[10px] text-muted-foreground">
                {t("menuLogoNone")}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="menu-logo-background-color">
                {t("menuLogoBackgroundColor")}
              </Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="menu-logo-background-color"
                  type="color"
                  className="h-12 w-16 cursor-pointer p-1"
                  value={
                    /^#([0-9A-Fa-f]{6})$/.test(backgroundColor)
                      ? backgroundColor
                      : "#ffffff"
                  }
                  disabled={
                    isPending || backgroundOpacity === FULLY_TRANSPARENT_OPACITY
                  }
                  onChange={(event) => {
                    const nextColor = event.target.value;
                    const nextOpacity =
                      backgroundOpacity === FULLY_TRANSPARENT_OPACITY
                        ? DEFAULT_BACKGROUND_COLOR_OPACITY
                        : backgroundOpacity;
                    setBackgroundColor(nextColor);
                    setBackgroundOpacity(nextOpacity);
                    saveBackground(nextColor, nextOpacity, t("menuLogoBackgroundSaved"));
                  }}
                />
                <Input
                  value={
                    backgroundOpacity === FULLY_TRANSPARENT_OPACITY
                      ? t("themesTransparent")
                      : backgroundColor
                  }
                  placeholder="#FFFFFF"
                  disabled={
                    isPending || backgroundOpacity === FULLY_TRANSPARENT_OPACITY
                  }
                  onChange={(event) => setBackgroundColor(event.target.value)}
                  onBlur={() => {
                    if (backgroundOpacity === FULLY_TRANSPARENT_OPACITY) return;
                    saveBackground(
                      backgroundColor,
                      backgroundOpacity,
                      t("menuLogoBackgroundSaved"),
                    );
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setBackgroundOpacity(FULLY_TRANSPARENT_OPACITY);
                    saveBackground(
                      backgroundColor,
                      FULLY_TRANSPARENT_OPACITY,
                      t("menuLogoBackgroundSaved"),
                    );
                  }}
                >
                  {t("themesTransparent")}
                </Button>
              </div>
              <div className="space-y-1">
                <Label htmlFor="menu-logo-background-opacity">
                  {t("menuLogoBackgroundOpacity")}
                </Label>
                <Input
                  id="menu-logo-background-opacity"
                  type="range"
                  min={0}
                  max={100}
                  value={backgroundOpacity}
                  disabled={isPending}
                  onChange={(event) =>
                    setBackgroundOpacity(Number(event.target.value))
                  }
                  onMouseUp={(event) => {
                    const nextOpacity = Number(event.currentTarget.value);
                    saveBackground(
                      backgroundColor,
                      nextOpacity,
                      t("menuLogoBackgroundSaved"),
                    );
                  }}
                  onTouchEnd={(event) => {
                    const nextOpacity = Number(event.currentTarget.value);
                    saveBackground(
                      backgroundColor,
                      nextOpacity,
                      t("menuLogoBackgroundSaved"),
                    );
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t("menuLogoBackgroundOpacityValue", {
                    value: backgroundOpacity,
                  })}
                </p>
              </div>
            </div>
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
