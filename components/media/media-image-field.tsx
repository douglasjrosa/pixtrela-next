"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { MediaPickerModal } from "@/components/settings/media-picker-modal";
import { AppImage } from "@/components/media/app-image";
import { Button } from "@/components/ui/button";
import { isSvgImageSrc } from "@/lib/media/image-optimization";
import type { MediaAssetRecord } from "@/lib/repos/media";
import { cn } from "@/lib/utils";

const PREVIEW_IMAGE_CLASS =
  "h-24 w-24 shrink-0 rounded-md border";

export interface MediaImageFieldProps {
  selectedId?: string | number | null;
  previewUrl?: string | null;
  disabled?: boolean;
  attachedLabel?: string;
  onSelect: (asset: MediaAssetRecord) => void;
  onRemove: () => void;
  onListImages: () => Promise<MediaAssetRecord[]>;
  onUploadImage: (formData: FormData) => Promise<MediaAssetRecord>;
  onUseDefault?: () => void;
  useDefaultLabel?: string;
}

export function MediaImageField({
  selectedId = null,
  previewUrl = null,
  disabled = false,
  attachedLabel,
  onSelect,
  onRemove,
  onListImages,
  onUploadImage,
  onUseDefault,
  useDefaultLabel,
}: MediaImageFieldProps) {
  const tCommon = useTranslations("common");
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedKey = selectedId == null ? null : String(selectedId);
  const hasPreview = Boolean(previewUrl);

  return (
    <>
      <div className="flex flex-wrap items-start gap-4">
        {previewUrl ? (
          <AppImage
            src={previewUrl}
            width={96}
            height={96}
            className={cn(
              PREVIEW_IMAGE_CLASS,
              isSvgImageSrc(previewUrl) ? "object-contain p-1" : "object-cover",
            )}
          />
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={disabled}
              onClick={() => setPickerOpen(true)}
            >
              {tCommon("imageChoose")}
            </Button>
            {onUseDefault && useDefaultLabel ? (
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={onUseDefault}
              >
                {useDefaultLabel}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={disabled || !hasPreview}
              onClick={onRemove}
            >
              {tCommon("imageRemove")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {tCommon("imageHint")}
          </p>
          {hasPreview ? (
            <p className="text-xs text-muted-foreground">
              {attachedLabel ?? tCommon("imageAttached")}
            </p>
          ) : null}
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        selectedId={selectedKey}
        onClose={() => setPickerOpen(false)}
        onConfirm={(asset) => {
          setPickerOpen(false);
          onSelect(asset);
        }}
        onListImages={onListImages}
        onUploadImage={onUploadImage}
      />
    </>
  );
}
