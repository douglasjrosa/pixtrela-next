"use client";

import { Camera, User } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { validateFacePhotoHasSingleFace } from "@/lib/kiosk/face/validate-face-photo-file";
import { compressProfileImage } from "@/lib/media/compress-profile-image";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export type UserImageType = "avatar" | "facePhoto";

export interface UserMediaFieldsProps {
  userName: string;
  avatarUrl?: string | null;
  facePhotoUrl?: string | null;
  disabled?: boolean;
  onUpload: (imageType: UserImageType, file: File) => void | Promise<void>;
}

type ImageFieldProps = {
  imageType: UserImageType;
  imageUrl?: string | null;
  userName: string;
  disabled: boolean;
  pending: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function UserImageField({
  imageType,
  imageUrl,
  userName,
  disabled,
  pending,
  onChange,
}: ImageFieldProps) {
  const t = useTranslations("users");
  const isAvatar = imageType === "avatar";
  const resolvedUrl = resolveStrapiMediaUrl(imageUrl ?? null);
  const inputId = `user-${imageType}`;

  return (
    <section className="flex min-w-0 items-center gap-3 rounded-lg border p-3">
      <div
        className={
          "flex size-20 shrink-0 items-center justify-center overflow-hidden " +
          "rounded-full border bg-background"
        }
      >
        {resolvedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedUrl}
            alt={
              isAvatar
                ? t("avatarAlt", { name: userName })
                : t("facePhotoAlt", { name: userName })
            }
            className="size-full object-cover"
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
          onClick={() => document.getElementById(inputId)?.click()}
        >
          {pending ? t("imageUploading") : t("imageChoose")}
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
  const [urls, setUrls] = useState({ avatar: avatarUrl, facePhoto: facePhotoUrl });
  const [pendingType, setPendingType] = useState<UserImageType | null>(null);

  async function handleImageChange(
    imageType: UserImageType,
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPendingType(imageType);
    try {
      const compressed = await compressProfileImage(file);
      if (imageType === "facePhoto") {
        const validation = await validateFacePhotoHasSingleFace(compressed);
        if (!validation.ok) {
          if (validation.reason === "multiple_faces") {
            showErrorToast(t("facePhotoMultipleFaces"));
          } else if (validation.reason === "no_face") {
            showErrorToast(t("facePhotoNoFace"));
          } else {
            showErrorToast(t("imageSaveFailed"));
          }
          return;
        }
      }

      await onUpload(imageType, compressed);
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

  return (
    <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
      <UserImageField
        imageType="avatar"
        imageUrl={urls.avatar}
        userName={userName}
        disabled={disabled}
        pending={pendingType === "avatar"}
        onChange={(event) => void handleImageChange("avatar", event)}
      />
      <UserImageField
        imageType="facePhoto"
        imageUrl={urls.facePhoto}
        userName={userName}
        disabled={disabled}
        pending={pendingType === "facePhoto"}
        onChange={(event) => void handleImageChange("facePhoto", event)}
      />
    </div>
  );
}
