"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { FaceOvalCapture } from "@/components/kiosk/face-oval-capture";
import { Button } from "@/components/ui/button";
import { validateFacePhotoHasSingleFace } from "@/lib/kiosk/face/validate-face-photo-file";
import { compressProfileImage } from "@/lib/media/compress-profile-image";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export interface UserMediaFieldsProps {
  avatarUrl?: string | null;
  facePhotoUrl?: string | null;
  disabled?: boolean;
  onSaveAvatar: (file: File) => boolean | Promise<boolean>;
  onSaveFacePhoto: (file: File) => boolean | Promise<boolean>;
}

export function UserMediaFields({
  avatarUrl,
  facePhotoUrl,
  disabled = false,
  onSaveAvatar,
  onSaveFacePhoto,
}: UserMediaFieldsProps) {
  const t = useTranslations("users");
  const tKiosk = useTranslations("kiosk");
  const tCommon = useTranslations("common");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [pendingFace, setPendingFace] = useState<File | null>(null);
  const [faceCaptureOpen, setFaceCaptureOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingFace, setSavingFace] = useState(false);

  const currentAvatar =
    avatarPreview ?? resolveStrapiMediaUrl(avatarUrl ?? null) ?? null;
  const currentFace =
    facePreview ?? resolveStrapiMediaUrl(facePhotoUrl ?? null) ?? null;

  function handleAvatarFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setPendingAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSaveAvatar(): Promise<void> {
    if (!pendingAvatar) return;
    setSavingAvatar(true);
    try {
      const compressed = await compressProfileImage(pendingAvatar);
      const ok = await onSaveAvatar(compressed);
      if (ok) {
        showSuccessToast(t("avatarSaved"));
        setPendingAvatar(null);
      } else {
        showErrorToast(t("avatarSaveFailed"));
      }
    } catch {
      showErrorToast(t("avatarSaveFailed"));
    } finally {
      setSavingAvatar(false);
    }
  }

  async function applyFaceFile(file: File): Promise<void> {
    if (facePreview) URL.revokeObjectURL(facePreview);
    setPendingFace(file);
    setFacePreview(URL.createObjectURL(file));
    setFaceCaptureOpen(false);
  }

  async function handleSaveFace(): Promise<void> {
    if (!pendingFace) return;
    setSavingFace(true);
    try {
      const compressed = await compressProfileImage(pendingFace);
      const validation = await validateFacePhotoHasSingleFace(compressed);
      if (validation.ok === false) {
        if (validation.reason === "multiple_faces") {
          showErrorToast(tKiosk("staffFacePhotoMultipleFaces"));
        } else if (validation.reason === "no_face") {
          showErrorToast(tKiosk("staffFacePhotoNoFace"));
        } else {
          showErrorToast(t("facePhotoSaveFailed"));
        }
        return;
      }
      const ok = await onSaveFacePhoto(compressed);
      if (ok) {
        showSuccessToast(t("facePhotoSaved"));
        setPendingFace(null);
      } else {
        showErrorToast(t("facePhotoSaveFailed"));
      }
    } catch {
      showErrorToast(t("facePhotoSaveFailed"));
    } finally {
      setSavingFace(false);
    }
  }

  if (faceCaptureOpen) {
    return (
      <div className="col-span-full space-y-3 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">{t("facePhotoTitle")}</h3>
        <FaceOvalCapture
          disabled={disabled || savingFace}
          onCancel={() => setFaceCaptureOpen(false)}
          onCapture={(file) => void applyFaceFile(file)}
        />
      </div>
    );
  }

  return (
    <div className="col-span-full grid gap-4 sm:grid-cols-2">
      <section className="space-y-3 rounded-lg border bg-card p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t("avatarTitle")}</h3>
          <p className="text-xs text-muted-foreground">{t("avatarHint")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border bg-background">
            {currentAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentAvatar}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              disabled={disabled || savingAvatar}
              onChange={handleAvatarFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || savingAvatar}
              onClick={() => avatarInputRef.current?.click()}
            >
              <Camera className="size-4" aria-hidden />
              {t("avatarTake")}
            </Button>
            {pendingAvatar ? (
              <Button
                type="button"
                size="sm"
                disabled={disabled || savingAvatar}
                onClick={() => void handleSaveAvatar()}
              >
                {tCommon("save")}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border bg-card p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t("facePhotoTitle")}</h3>
          <p className="text-xs text-muted-foreground">{t("facePhotoHint")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border bg-background">
            {currentFace ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentFace}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Camera className="size-6 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || savingFace}
              onClick={() => setFaceCaptureOpen(true)}
            >
              <Camera className="size-4" aria-hidden />
              {pendingFace || currentFace ? t("facePhotoRetake") : t("facePhotoTake")}
            </Button>
            {pendingFace ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || savingFace}
                  onClick={() => setFaceCaptureOpen(true)}
                >
                  <RotateCcw className="size-4" aria-hidden />
                  {tKiosk("staffFacePhotoRetake")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={disabled || savingFace}
                  onClick={() => void handleSaveFace()}
                >
                  {tCommon("save")}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
