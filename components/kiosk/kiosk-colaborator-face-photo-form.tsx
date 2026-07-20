"use client";

import { useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { validateFacePhotoHasSingleFace } from "@/lib/kiosk/face/validate-face-photo-file";
import { compressProfileImage } from "@/lib/media/compress-profile-image";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { showErrorToast } from "@/lib/ui/app-toast";

export interface KioskColaboratorFacePhotoFormProps {
  facePhotoUrl?: string | null;
  disabled?: boolean;
  onSave: (file: File) => boolean | Promise<boolean>;
}

export function KioskColaboratorFacePhotoForm({
  facePhotoUrl,
  disabled = false,
  onSave,
}: KioskColaboratorFacePhotoFormProps) {
  const t = useTranslations("kiosk");
  const tCommon = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentUrl =
    previewUrl ?? resolveStrapiMediaUrl(facePhotoUrl ?? null) ?? null;

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
      const validation = await validateFacePhotoHasSingleFace(compressed);
      if (validation.ok === false) {
        if (validation.reason === "multiple_faces") {
          showErrorToast(t("staffFacePhotoMultipleFaces"));
        } else if (validation.reason === "no_face") {
          showErrorToast(t("staffFacePhotoNoFace"));
        } else {
          showErrorToast(t("staffFacePhotoForbidden"));
        }
        return;
      }
      await onSave(compressed);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t("staffFacePhotoTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("staffFacePhotoHint")}</p>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border bg-background">
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt=""
              className="size-full object-cover"
              crossOrigin="anonymous"
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
            {t("staffFacePhotoTake")}
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
                {t("staffFacePhotoRetake")}
              </Button>
              <Button
                type="button"
                disabled={disabled || isSaving}
                onClick={() => void handleSave()}
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
