"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { MediaPickerModal } from "@/components/settings/media-picker-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BrandingSlotConfig } from "@/lib/domain/branding-slots";
import type { BrandingSlotKey } from "@/lib/domain/branding-slots";
import {
  DEFAULT_CART_WATERMARK_DISPLAY_OPACITY,
  DEFAULT_CART_WATERMARK_WIDTH_PERCENT,
  resolveBrandingBackgroundStyle,
  resolveCartWatermarkStyle,
} from "@/lib/domain/branding-slots";
import type { MediaAssetRecord } from "@/lib/repos/media";
import {
  DEFAULT_BACKGROUND_COLOR_OPACITY,
  FULLY_TRANSPARENT_OPACITY,
} from "@/lib/themes/match-route-theme";

export type BrandingMediaSlotEditorProps = {
  slotKey: BrandingSlotKey;
  titleKey: string;
  savedKey: string;
  noneKey: string;
  chooseKey: string;
  removeKey: string;
  backgroundColorKey: string;
  backgroundOpacityKey: string;
  backgroundOpacityValueKey: string;
  backgroundSavedKey: string;
  displayOpacityKey?: string;
  displayOpacityValueKey?: string;
  widthPercentKey?: string;
  widthPercentValueKey?: string;
  initialMediaId: string | null;
  initialMediaUrl: string | null;
  initialConfig: BrandingSlotConfig;
  supportsBackground: boolean;
  supportsDisplay: boolean;
  onListImages: () => Promise<MediaAssetRecord[]>;
  onUploadImage: (formData: FormData) => Promise<MediaAssetRecord>;
  onSaveMedia: (mediaId: string | null) => Promise<void>;
  onSaveConfig: (config: BrandingSlotConfig) => Promise<void>;
};

export function BrandingMediaSlotEditor({
  slotKey,
  titleKey,
  savedKey,
  noneKey,
  chooseKey,
  removeKey,
  backgroundColorKey,
  backgroundOpacityKey,
  backgroundOpacityValueKey,
  backgroundSavedKey,
  displayOpacityKey,
  displayOpacityValueKey,
  widthPercentKey,
  widthPercentValueKey,
  initialMediaId,
  initialMediaUrl,
  initialConfig,
  supportsBackground,
  supportsDisplay,
  onListImages,
  onUploadImage,
  onSaveMedia,
  onSaveConfig,
}: BrandingMediaSlotEditorProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [mediaId, setMediaId] = useState(initialMediaId);
  const [mediaUrl, setMediaUrl] = useState(initialMediaUrl);
  const [backgroundColor, setBackgroundColor] = useState(
    initialConfig.backgroundColor ?? "#ffffff",
  );
  const [backgroundOpacity, setBackgroundOpacity] = useState(
    initialConfig.backgroundColorOpacity ?? FULLY_TRANSPARENT_OPACITY,
  );
  const [displayOpacity, setDisplayOpacity] = useState(
    initialConfig.displayOpacity ?? DEFAULT_CART_WATERMARK_DISPLAY_OPACITY,
  );
  const [widthPercent, setWidthPercent] = useState(
    initialConfig.widthPercent ?? DEFAULT_CART_WATERMARK_WIDTH_PERCENT,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const listImages = useCallback(() => onListImages(), [onListImages]);
  const previewBackground = resolveBrandingBackgroundStyle({
    backgroundColor,
    backgroundColorOpacity: backgroundOpacity,
  });
  const watermarkStyle = resolveCartWatermarkStyle({
    displayOpacity,
    widthPercent,
  });

  function saveConfig(
    next: BrandingSlotConfig,
    successMessage: string,
  ): void {
    startTransition(async () => {
      setMessage(null);
      try {
        await onSaveConfig(next);
        setMessage(successMessage);
      } catch {
        setMessage(tCommon("errorGeneric"));
      }
    });
  }

  function saveBackground(
    nextColor: string,
    nextOpacity: number,
    successMessage: string,
  ): void {
    if (!supportsBackground) return;
    saveConfig(
      {
        backgroundColor:
          nextOpacity === FULLY_TRANSPARENT_OPACITY ? null : nextColor,
        backgroundColorOpacity: nextOpacity,
      },
      successMessage,
    );
  }

  function saveDisplay(
    nextDisplayOpacity: number,
    nextWidthPercent: number,
    successMessage: string,
  ): void {
    if (!supportsDisplay) return;
    saveConfig(
      {
        displayOpacity: nextDisplayOpacity,
        widthPercent: nextWidthPercent,
      },
      successMessage,
    );
  }

  function handleConfirm(asset: MediaAssetRecord): void {
    setPickerOpen(false);
    startTransition(async () => {
      setMessage(null);
      try {
        await onSaveMedia(asset.id);
        setMediaId(asset.id);
        setMediaUrl(asset.browserUrl);
        setMessage(t(savedKey));
      } catch {
        setMessage(tCommon("errorGeneric"));
      }
    });
  }

  function handleRemove(): void {
    startTransition(async () => {
      setMessage(null);
      try {
        await onSaveMedia(null);
        setMediaId(null);
        setMediaUrl(null);
        setMessage(t(savedKey));
      } catch {
        setMessage(tCommon("errorGeneric"));
      }
    });
  }

  return (
    <div className="space-y-3" data-testid={`branding-slot-${slotKey}`}>
      <p className="text-sm font-medium">{t(titleKey)}</p>
      <div className="flex flex-wrap items-start gap-4">
        <div
          className="relative flex size-16 items-center justify-center overflow-hidden rounded-md border p-1"
          style={{ backgroundColor: previewBackground ?? undefined }}
        >
          {mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="size-full object-contain" />
          ) : (
            <span className="px-2 text-center text-[10px] text-muted-foreground">
              {t(noneKey)}
            </span>
          )}
          {supportsDisplay && mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt=""
              className="pointer-events-none absolute right-1 bottom-1 object-contain"
              style={{
                width: `${watermarkStyle.widthPercent}%`,
                maxHeight: "100%",
                opacity: watermarkStyle.opacity / 100,
              }}
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={isPending}
              onClick={() => setPickerOpen(true)}
            >
              {t(chooseKey)}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending || !mediaId}
              onClick={handleRemove}
            >
              {t(removeKey)}
            </Button>
          </div>

          {supportsBackground ? (
            <div className="space-y-2">
              <Label htmlFor={`${slotKey}-background-color`}>
                {t(backgroundColorKey)}
              </Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id={`${slotKey}-background-color`}
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
                    saveBackground(nextColor, nextOpacity, t(backgroundSavedKey));
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
                      t(backgroundSavedKey),
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
                      t(backgroundSavedKey),
                    );
                  }}
                >
                  {t("themesTransparent")}
                </Button>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${slotKey}-background-opacity`}>
                  {t(backgroundOpacityKey)}
                </Label>
                <Input
                  id={`${slotKey}-background-opacity`}
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
                      t(backgroundSavedKey),
                    );
                  }}
                  onTouchEnd={(event) => {
                    const nextOpacity = Number(event.currentTarget.value);
                    saveBackground(
                      backgroundColor,
                      nextOpacity,
                      t(backgroundSavedKey),
                    );
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t(backgroundOpacityValueKey, { value: backgroundOpacity })}
                </p>
              </div>
            </div>
          ) : null}

          {supportsDisplay && displayOpacityKey && widthPercentKey ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor={`${slotKey}-display-opacity`}>
                  {t(displayOpacityKey)}
                </Label>
                <Input
                  id={`${slotKey}-display-opacity`}
                  type="range"
                  min={0}
                  max={100}
                  value={displayOpacity}
                  disabled={isPending}
                  onChange={(event) =>
                    setDisplayOpacity(Number(event.target.value))
                  }
                  onMouseUp={(event) => {
                    const nextOpacity = Number(event.currentTarget.value);
                    saveDisplay(nextOpacity, widthPercent, t(savedKey));
                  }}
                  onTouchEnd={(event) => {
                    const nextOpacity = Number(event.currentTarget.value);
                    saveDisplay(nextOpacity, widthPercent, t(savedKey));
                  }}
                />
                {displayOpacityValueKey ? (
                  <p className="text-xs text-muted-foreground">
                    {t(displayOpacityValueKey, { value: displayOpacity })}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${slotKey}-width-percent`}>
                  {t(widthPercentKey)}
                </Label>
                <Input
                  id={`${slotKey}-width-percent`}
                  type="range"
                  min={1}
                  max={100}
                  value={widthPercent}
                  disabled={isPending}
                  onChange={(event) =>
                    setWidthPercent(Number(event.target.value))
                  }
                  onMouseUp={(event) => {
                    const nextWidth = Number(event.currentTarget.value);
                    saveDisplay(displayOpacity, nextWidth, t(savedKey));
                  }}
                  onTouchEnd={(event) => {
                    const nextWidth = Number(event.currentTarget.value);
                    saveDisplay(displayOpacity, nextWidth, t(savedKey));
                  }}
                />
                {widthPercentValueKey ? (
                  <p className="text-xs text-muted-foreground">
                    {t(widthPercentValueKey, { value: widthPercent })}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      <MediaPickerModal
        open={pickerOpen}
        selectedId={mediaId}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleConfirm}
        onListImages={listImages}
        onUploadImage={onUploadImage}
      />
    </div>
  );
}
