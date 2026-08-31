"use client";

import { User } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";

import { FaceOvalCapture } from "@/components/kiosk/face-oval-capture";
import { AppImage } from "@/components/media/app-image";
import { Button } from "@/components/ui/button";
import { compressProfileImage } from "@/lib/media/compress-profile-image";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export interface ProfileAvatarEditorProps {
  userName: string;
  avatarUrl?: string | null;
  disabled?: boolean;
  onUpload: (file: File) => boolean | Promise<boolean>;
}

export function ProfileAvatarEditor({
  userName,
  avatarUrl,
  disabled = false,
  onUpload,
}: ProfileAvatarEditorProps) {
  const t = useTranslations("profile");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  const resolvedUrl =
    previewUrl ?? toBrowserMediaUrl(avatarUrl ?? null) ?? null;

  async function uploadFile(file: File): Promise<void> {
    setPending(true);
    try {
      const compressed = await compressProfileImage(file);
      const ok = await onUpload(compressed);
      if (!ok) {
        showErrorToast(t("imageSaveFailed"));
        return;
      }
      setPreviewUrl(URL.createObjectURL(compressed));
      showSuccessToast(t("imageSaved"));
    } catch {
      showErrorToast(t("imageSaveFailed"));
    } finally {
      setPending(false);
    }
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadFile(file);
  }

  async function handleCapture(file: File): Promise<void> {
    setCaptureOpen(false);
    await uploadFile(file);
  }

  if (captureOpen) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("avatarTitle")}</h2>
        <FaceOvalCapture
          disabled={disabled || pending}
          onCancel={() => setCaptureOpen(false)}
          onCapture={(file) => void handleCapture(file)}
        />
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-4">
        <div
          className={
            "relative flex size-24 shrink-0 items-center justify-center overflow-hidden " +
            "rounded-full border bg-background"
          }
        >
          {resolvedUrl ? (
            <AppImage
              src={resolvedUrl}
              alt={t("avatarAlt", { name: userName })}
              fill
              className="object-cover"
            />
          ) : (
            <User className="size-10 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold">{t("avatarTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("avatarHint")}</p>
        </div>
      </div>

      <input
        id="profile-avatar-upload"
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={t("uploadPhoto")}
        disabled={disabled || pending}
        onChange={(event) => void handleFileChange(event)}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={disabled || pending}
          onClick={() => setCaptureOpen(true)}
        >
          {pending ? t("imageUploading") : t("takePhoto")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || pending}
          onClick={() => {
            document.getElementById("profile-avatar-upload")?.click();
          }}
        >
          {pending ? t("imageUploading") : t("uploadPhoto")}
        </Button>
      </div>
    </section>
  );
}
