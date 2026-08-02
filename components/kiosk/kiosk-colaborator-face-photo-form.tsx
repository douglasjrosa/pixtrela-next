"use client";

import { useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { FaceOvalCapture } from "@/components/kiosk/face-oval-capture";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  const currentUrl =
    previewUrl ?? resolveStrapiMediaUrl(facePhotoUrl ?? null) ?? null;

  function applyCapturedFile(file: File): void {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCaptureOpen(false);
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

  if (captureOpen) {
    return (
      <section className="space-y-4 rounded-lg border bg-card p-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{t("staffFacePhotoTitle")}</h3>
          <p className="text-sm text-muted-foreground">{t("staffFacePhotoHint")}</p>
        </div>
        <FaceOvalCapture
          disabled={disabled || isSaving}
          onCancel={() => setCaptureOpen(false)}
          onCapture={applyCapturedFile}
        />
      </section>
    );
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
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isSaving}
            onClick={() => setCaptureOpen(true)}
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
                onClick={() => setCaptureOpen(true)}
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
