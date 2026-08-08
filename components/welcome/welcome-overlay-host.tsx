"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { KioskFaceWelcome } from "@/components/kiosk/kiosk-face-welcome";
import {
  consumeWelcomePayload,
  type WelcomePayload,
} from "@/lib/welcome/welcome-session";

/** Mount once in the app shell; shows a pending welcome modal after navigation. */
export function WelcomeOverlayHost() {
  const pathname = usePathname();
  const [payload, setPayload] = useState<WelcomePayload | null>(null);

  useEffect(() => {
    const next = consumeWelcomePayload();
    if (next) setPayload(next);
  }, [pathname]);

  const handleDone = useCallback(() => {
    setPayload(null);
  }, []);

  if (!payload) return null;

  return (
    <KioskFaceWelcome
      name={payload.name}
      greetingGender={payload.greetingGender}
      avatarUrl={payload.avatarUrl}
      facePhotoUrl={payload.facePhotoUrl}
      onDone={handleDone}
    />
  );
}
