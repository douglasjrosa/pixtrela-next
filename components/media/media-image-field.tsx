"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { MediaPickerModal } from "@/components/settings/media-picker-modal";
import { AppImage } from "@/components/media/app-image";
import { Button } from "@/components/ui/button";
import type { MediaAssetRecord } from "@/lib/repos/media";

const PREVIEW_IMAGE_CLASS =
  "h-24 w-24 shrink-0 rounded-md border object-cover";

export interface MediaImageFieldProps {
  selectedId?: string | number | null;
  previewUrl?: string | null;
  disabled?: boolean;
  attachedLabel?: string;
  onSelect: (asset: MediaAssetRecord) => void;
  onRemove: () => void;
  onListImages: () => Promise<MediaAssetRecord[]>;
  onUploadImage: (formData: FormData) => Promise<MediaAssetRecord>;
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
}: MediaImageFieldProps) {
  const tCommon = useTranslations("common");
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedKey = selectedId == null ? null : String(selectedId);
  const hasSelection = selectedKey !== null && selectedKey.length > 0;

  return (
    <>
      <div className="flex flex-wrap items-start gap-4">
        {previewUrl ? (
          <AppImage
            src={previewUrl}
            width={96}
            height={96}
            className={PREVIEW_IMAGE_CLASS}
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
            <Button
              type="button"
              variant="outline"
              disabled={disabled || !hasSelection}
              onClick={onRemove}
            >
              {tCommon("imageRemove")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {tCommon("imageHint")}
          </p>
          {hasSelection ? (
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
