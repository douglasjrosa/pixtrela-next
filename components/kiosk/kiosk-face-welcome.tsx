"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import {
  KIOSK_FACE_WELCOME_MS,
  formatKioskWelcomeMessage,
  type GreetingGender,
} from "@/lib/business/kiosk-welcome";
import { toBrowserStrapiMediaUrl } from "@/lib/strapi/browser-media-url";

export interface KioskFaceWelcomeProps {
  name: string;
  greetingGender?: GreetingGender | null;
  avatarUrl?: string | null;
  facePhotoUrl?: string | null;
  onDone: () => void;
  durationMs?: number;
}

export function KioskFaceWelcome({
  name,
  greetingGender,
  avatarUrl,
  facePhotoUrl,
  onDone,
  durationMs = KIOSK_FACE_WELCOME_MS,
}: KioskFaceWelcomeProps) {
  const t = useTranslations("kiosk");
  const imageUrl =
    toBrowserStrapiMediaUrl(avatarUrl ?? null) ??
    toBrowserStrapiMediaUrl(facePhotoUrl ?? null);
  const message = formatKioskWelcomeMessage(name, greetingGender);

  useEffect(() => {
    const timer = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDone]);

  return (
    <div
      className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex size-40 items-center justify-center overflow-hidden rounded-full border-4 border-primary/40 bg-muted shadow-lg">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={t("faceWelcomeAvatarAlt", { name })}
            className="size-full object-cover"
          />
        ) : (
          <span className="text-4xl font-semibold text-muted-foreground">
            {name.trim().charAt(0).toUpperCase() || "?"}
          </span>
        )}
      </div>
      <p className="text-center text-2xl font-semibold tracking-tight">
        {message}
      </p>
    </div>
  );
}
