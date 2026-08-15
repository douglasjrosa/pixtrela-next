"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
  KIOSK_FACE_WELCOME_FADE_MS,
  KIOSK_FACE_WELCOME_MS,
  formatKioskWelcomeMessage,
  type GreetingGender,
} from "@/lib/business/kiosk-welcome";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { cn } from "@/lib/utils";

export interface KioskFaceWelcomeProps {
  name: string;
  greetingGender?: GreetingGender | null;
  avatarUrl?: string | null;
  facePhotoUrl?: string | null;
  onDone: () => void;
  durationMs?: number;
  fadeMs?: number;
}

/**
 * Full-screen welcome modal shown over the destination screen.
 * The entire modal (backdrop + card) fades out before onDone.
 */
export function KioskFaceWelcome({
  name,
  greetingGender,
  avatarUrl,
  facePhotoUrl,
  onDone,
  durationMs = KIOSK_FACE_WELCOME_MS,
  fadeMs = KIOSK_FACE_WELCOME_FADE_MS,
}: KioskFaceWelcomeProps) {
  const t = useTranslations("kiosk");
  const [fadingOut, setFadingOut] = useState(false);
  const imageUrl =
    toBrowserMediaUrl(avatarUrl ?? null) ??
    toBrowserMediaUrl(facePhotoUrl ?? null);
  const message = formatKioskWelcomeMessage(name, greetingGender);
  const safeFadeMs = Math.min(Math.max(fadeMs, 0), durationMs);
  const holdMs = durationMs - safeFadeMs;

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, holdMs);
    const doneTimer = window.setTimeout(onDone, durationMs);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [durationMs, holdMs, onDone]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center",
        "bg-black/55 p-4 transition-opacity ease-out",
        fadingOut ? "opacity-0" : "opacity-100",
      )}
      style={{ transitionDuration: `${safeFadeMs}ms` }}
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      data-fading={fadingOut ? "true" : "false"}
    >
      <div
        className={
          "flex w-full max-w-md flex-col items-center gap-6 rounded-3xl " +
          "border bg-card px-6 py-10 shadow-2xl"
        }
        role="status"
      >
        <div
          className={
            "flex size-40 items-center justify-center overflow-hidden " +
            "rounded-full border-4 border-primary/40 bg-muted shadow-lg"
          }
        >
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
    </div>
  );
}
