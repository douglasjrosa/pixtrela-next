"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { KioskFaceWelcome } from "@/components/kiosk/kiosk-face-welcome";
import {
  clearWelcomePayload,
  peekWelcomePayload,
  type WelcomePayload,
} from "@/lib/welcome/welcome-session";

/** Mount once in the app shell; shows a pending welcome modal after navigation. */
export function WelcomeOverlayHost() {
  const pathname = usePathname();
  const [payload, setPayload] = useState<WelcomePayload | null>(null);

  useEffect(() => {
    // Peek only: Strict Mode remounts must still find the payload.
    // Clear when the modal finishes (onDone), not on first paint.
    const next = peekWelcomePayload();
    if (next) setPayload(next);
  }, [pathname]);

  const handleDone = useCallback(() => {
    clearWelcomePayload();
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
