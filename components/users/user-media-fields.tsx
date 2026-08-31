"use client";

import { Camera, User } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";

import { FaceOvalCapture } from "@/components/kiosk/face-oval-capture";
import { AppImage } from "@/components/media/app-image";
import { Button } from "@/components/ui/button";
import { extractFaceDescriptorFromFile } from "@/lib/kiosk/face/extract-face-descriptor";
import { compressProfileImage } from "@/lib/media/compress-profile-image";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export type UserImageType = "avatar" | "facePhoto";

export type UserMediaUploadOptions = {
  faceVector?: number[];
};

export interface UserMediaFieldsProps {
  userName: string;
  avatarUrl?: string | null;
  facePhotoUrl?: string | null;
  disabled?: boolean;
  onUpload: (
    imageType: UserImageType,
    file: File,
    options?: UserMediaUploadOptions,
  ) => void | Promise<void>;
}

type ImageFieldProps = {
  imageType: UserImageType;
  imageUrl?: string | null;
  userName: string;
  disabled: boolean;
  pending: boolean;
  onChooseFile: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  chooseLabel: string;
};

function UserImageField({
  imageType,
  imageUrl,
  userName,
  disabled,
  pending,
  onChooseFile,
  onChange,
  inputId,
  chooseLabel,
}: ImageFieldProps) {
  const t = useTranslations("users");
  const isAvatar = imageType === "avatar";
  const resolvedUrl = toBrowserMediaUrl(imageUrl ?? null);

  return (
    <section className="flex min-w-0 items-center gap-3 rounded-lg border p-3">
      <div
        className={
          "relative flex size-20 shrink-0 items-center justify-center overflow-hidden " +
          "rounded-full border bg-background"
        }
      >
        {resolvedUrl ? (
          <AppImage
            src={resolvedUrl}
            alt={
              isAvatar
                ? t("avatarAlt", { name: userName })
                : t("facePhotoAlt", { name: userName })
            }
            fill
            className="object-cover"
          />
        ) : isAvatar ? (
          <User className="size-8 text-muted-foreground" aria-hidden />
        ) : (
          <Camera className="size-8 text-muted-foreground" aria-hidden />
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <div>
          <h3 className="font-medium">
            {isAvatar ? t("avatarTitle") : t("facePhotoTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isAvatar ? t("avatarHint") : t("facePhotoHint")}
          </p>
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          capture={isAvatar ? "user" : undefined}
          className="sr-only"
          aria-label={
            isAvatar ? t("avatarInputLabel") : t("facePhotoInputLabel")
          }
          disabled={disabled || pending}
          onChange={onChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || pending}
          onClick={onChooseFile}
        >
          {pending ? t("imageUploading") : chooseLabel}
        </Button>
      </div>
    </section>
  );
}

export function UserMediaFields({
  userName,
  avatarUrl,
  facePhotoUrl,
  disabled = false,
  onUpload,
}: UserMediaFieldsProps) {
  const t = useTranslations("users");
  const [urls, setUrls] = useState({
    avatar: avatarUrl,
    facePhoto: facePhotoUrl,
  });
  const [pendingType, setPendingType] = useState<UserImageType | null>(null);
  const [faceCaptureOpen, setFaceCaptureOpen] = useState(false);
  const [prevMediaUrls, setPrevMediaUrls] = useState({
    avatar: avatarUrl,
    facePhoto: facePhotoUrl,
  });
  if (
    avatarUrl !== prevMediaUrls.avatar ||
    facePhotoUrl !== prevMediaUrls.facePhoto
  ) {
    setPrevMediaUrls({ avatar: avatarUrl, facePhoto: facePhotoUrl });
    setUrls({ avatar: avatarUrl, facePhoto: facePhotoUrl });
  }

  async function uploadImage(
    imageType: UserImageType,
    file: File,
  ): Promise<void> {
    setPendingType(imageType);
    try {
      const compressed = await compressProfileImage(file);
      let faceVector: number[] | undefined;
      if (imageType === "facePhoto") {
        const extracted = await extractFaceDescriptorFromFile(compressed);
        if (!extracted.ok) {
          if (extracted.reason === "multiple_faces") {
            showErrorToast(t("facePhotoMultipleFaces"));
          } else if (
            extracted.reason === "no_face" ||
            extracted.reason === "too_small"
          ) {
            showErrorToast(t("facePhotoNoFace"));
          } else {
            showErrorToast(t("imageSaveFailed"));
          }
          return;
        }
        faceVector = extracted.faceVector;
      }

      await onUpload(
        imageType,
        compressed,
        faceVector ? { faceVector } : undefined,
      );
      setUrls((current) => ({
        ...current,
        [imageType]: URL.createObjectURL(compressed),
      }));
      showSuccessToast(t("imageSaved"));
    } catch {
      showErrorToast(t("imageSaveFailed"));
    } finally {
      setPendingType(null);
    }
  }

  async function handleImageChange(
    imageType: UserImageType,
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadImage(imageType, file);
  }

  async function handleFaceCapture(file: File): Promise<void> {
    setFaceCaptureOpen(false);
    await uploadImage("facePhoto", file);
  }

  if (faceCaptureOpen) {
    return (
      <div className="space-y-3 sm:col-span-2">
        <h3 className="font-medium">{t("facePhotoTitle")}</h3>
        <FaceOvalCapture
          disabled={disabled || pendingType === "facePhoto"}
          onCancel={() => setFaceCaptureOpen(false)}
          onCapture={(file) => void handleFaceCapture(file)}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
      <UserImageField
        imageType="avatar"
        imageUrl={urls.avatar}
        userName={userName}
        disabled={disabled}
        pending={pendingType === "avatar"}
        inputId="user-avatar"
        chooseLabel={t("imageChoose")}
        onChooseFile={() => document.getElementById("user-avatar")?.click()}
        onChange={(event) => void handleImageChange("avatar", event)}
      />
      <UserImageField
        imageType="facePhoto"
        imageUrl={urls.facePhoto}
        userName={userName}
        disabled={disabled}
        pending={pendingType === "facePhoto"}
        inputId="user-facePhoto"
        chooseLabel={t("facePhotoTake")}
        onChooseFile={() => setFaceCaptureOpen(true)}
        onChange={(event) => void handleImageChange("facePhoto", event)}
      />
    </div>
  );
}
