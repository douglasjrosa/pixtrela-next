"use client";

import { useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { compressProfileImage } from "@/lib/media/compress-profile-image";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";

export interface KioskColaboratorAvatarFormProps {
  avatarUrl?: string | null;
  disabled?: boolean;
  onSave: (file: File) => boolean | Promise<boolean>;
}

export function KioskColaboratorAvatarForm({
  avatarUrl,
  disabled = false,
  onSave,
}: KioskColaboratorAvatarFormProps) {
  const t = useTranslations("kiosk");
  const tCommon = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentUrl =
    previewUrl ?? resolveStrapiMediaUrl(avatarUrl ?? null) ?? null;

  function handlePickFile(): void {
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRetake(): void {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPendingFile(null);
    handlePickFile();
  }

  async function handleSave(): Promise<void> {
    if (!pendingFile) return;
    setIsSaving(true);
    try {
      const compressed = await compressProfileImage(pendingFile);
      await onSave(compressed);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <h3 className="text-base font-semibold">{t("staffAvatarTitle")}</h3>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border bg-background">
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Camera className="size-8 text-muted-foreground" aria-hidden />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            disabled={disabled || isSaving}
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isSaving}
            onClick={handlePickFile}
          >
            <Camera className="size-4" aria-hidden />
            {t("staffAvatarTake")}
          </Button>
          {pendingFile ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={disabled || isSaving}
                onClick={handleRetake}
              >
                <RotateCcw className="size-4" aria-hidden />
                {t("staffAvatarRetake")}
              </Button>
              <Button
                type="button"
                disabled={disabled || isSaving}
                onClick={handleSave}
              >
                {tCommon("save")}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
