"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import type { MediaAssetRecord } from "@/lib/repos/media";
import {
  MEDIA_THUMBNAIL_FRAME_CLASS,
  MEDIA_THUMBNAIL_IMAGE_CLASS,
} from "@/lib/media/media-thumbnail-styles";
import { cn } from "@/lib/utils";

export interface MediaPickerModalProps {
  open: boolean;
  selectedId?: string | null;
  onClose: () => void;
  onConfirm: (asset: MediaAssetRecord) => void;
  onListImages: () => Promise<MediaAssetRecord[]>;
  onUploadImage: (formData: FormData) => Promise<MediaAssetRecord>;
}

export function MediaPickerModal({
  open,
  selectedId = null,
  onClose,
  onConfirm,
  onListImages,
  onUploadImage,
}: MediaPickerModalProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaAssetRecord[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(selectedId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setItems([]);
      setPendingId(selectedId);
      setError(null);
      return;
    }

    let cancelled = false;
    startTransition(async () => {
      setError(null);
      try {
        const next = await onListImages();
        if (cancelled) return;
        setItems(next);
        setPendingId(selectedId);
      } catch {
        if (cancelled) return;
        setError(tCommon("errorGeneric"));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, onListImages, selectedId, tCommon]);

  function handleUpload(fileList: FileList | null): void {
    const file = fileList?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      setError(null);
      try {
        const asset = await onUploadImage(formData);
        setItems((current) => [asset, ...current]);
        setPendingId(asset.id);
      } catch (uploadError) {
        const code =
          uploadError instanceof Error ? uploadError.message : "";
        setError(
          code === "unsupportedType"
            ? t("mediaUnsupportedType")
            : tCommon("errorGeneric"),
        );
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const selected = items.find((item) => item.id === pendingId) ?? null;

  return (
    <FormModalShell
      open={open}
      title={t("mediaPickerTitle")}
      onClose={onClose}
      disabled={isPending}
      size="lg"
      layer="nested"
      fillBody={false}
      footerEnd={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {t("mediaPickerUpload")}
          </Button>
          <Button
            type="button"
            disabled={isPending || !selected}
            onClick={() => {
              if (selected) onConfirm(selected);
            }}
          >
            {t("mediaPickerConfirm")}
          </Button>
        </>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleUpload(event.target.files)}
      />

      {error ? (
        <p role="status" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("mediaPickerEmpty")}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((item) => {
            const active = item.id === pendingId;
            const title = item.originalFilename?.trim() || item.storageKey;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setPendingId(item.id)}
                  className={cn(
                    "w-full overflow-hidden rounded-md border",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-ring",
                    active && "ring-2 ring-ring",
                  )}
                >
                  <span className={MEDIA_THUMBNAIL_FRAME_CLASS}>
                    {item.browserUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.browserUrl}
                        alt={title}
                        className={MEDIA_THUMBNAIL_IMAGE_CLASS}
                      />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </FormModalShell>
  );
}
