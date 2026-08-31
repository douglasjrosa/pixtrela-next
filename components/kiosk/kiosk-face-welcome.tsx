"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  KIOSK_FACE_WELCOME_FADE_MS,
  KIOSK_FACE_WELCOME_MS,
  formatKioskWelcomeMessage,
  type GreetingGender,
} from "@/lib/business/kiosk-welcome";
import { AppImage } from "@/components/media/app-image";
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
  showLoading?: boolean;
  ready?: boolean;
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
  showLoading = false,
  ready = true,
}: KioskFaceWelcomeProps) {
  const t = useTranslations("kiosk");
  const tCommon = useTranslations("common");
  const [fadingOut, setFadingOut] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const imageUrl =
    toBrowserMediaUrl(avatarUrl ?? null) ??
    toBrowserMediaUrl(facePhotoUrl ?? null);
  const message = formatKioskWelcomeMessage(name, greetingGender);
  const safeFadeMs = Math.min(Math.max(fadeMs, 0), durationMs);
  const holdMs = durationMs - safeFadeMs;

  useEffect(() => {
    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }
    if (!ready) return;
    const elapsedMs = Date.now() - startedAtRef.current;
    const waitHoldMs = Math.max(0, holdMs - elapsedMs);
    const waitDoneMs = Math.max(waitHoldMs + safeFadeMs, durationMs - elapsedMs);
    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, waitHoldMs);
    const doneTimer = window.setTimeout(onDone, waitDoneMs);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [durationMs, holdMs, onDone, ready, safeFadeMs]);

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
            "relative flex size-40 items-center justify-center overflow-hidden " +
            "rounded-full border-4 border-primary/40 bg-muted shadow-lg"
          }
        >
          {imageUrl ? (
            <AppImage
              src={imageUrl}
              alt={t("faceWelcomeAvatarAlt", { name })}
              fill
              className="object-cover"
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
        {showLoading ? (
          <p className="text-center text-sm text-muted-foreground" role="status">
            {tCommon("loading")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
