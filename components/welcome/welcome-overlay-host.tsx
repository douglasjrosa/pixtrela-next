"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { KioskFaceWelcome } from "@/components/kiosk/kiosk-face-welcome";
import { isKioskColaboratorPanelPath } from "@/lib/kiosk/kiosk-link";
import {
  KIOSK_WELCOME_READY_EVENT,
  isKioskColaboratorReady,
  resetKioskColaboratorReady,
} from "@/lib/welcome/kiosk-welcome-ready";
import {
  clearWelcomePayload,
  peekWelcomePayload,
  type WelcomePayload,
} from "@/lib/welcome/welcome-session";

/** Mount once in the app shell; shows a pending welcome modal after navigation. */
export function WelcomeOverlayHost() {
  const pathname = usePathname();
  const [payload, setPayload] = useState<WelcomePayload | null>(null);
  const [destinationReady, setDestinationReady] = useState(true);
  const [prevPathname, setPrevPathname] = useState<string | null>(null);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    resetKioskColaboratorReady();
    const next = peekWelcomePayload();
    if (next) setPayload(next);
    const waitForQueue = isKioskColaboratorPanelPath(pathname);
    setDestinationReady(!waitForQueue || isKioskColaboratorReady());
  } else if (
    payload &&
    isKioskColaboratorPanelPath(pathname) &&
    isKioskColaboratorReady() &&
    !destinationReady
  ) {
    setDestinationReady(true);
  }

  useEffect(() => {
    if (!payload || !isKioskColaboratorPanelPath(pathname)) return;
    if (isKioskColaboratorReady()) return;
    function onReady(): void {
      setDestinationReady(true);
    }
    window.addEventListener(KIOSK_WELCOME_READY_EVENT, onReady);
    return () => {
      window.removeEventListener(KIOSK_WELCOME_READY_EVENT, onReady);
    };
  }, [payload, pathname]);

  const handleDone = useCallback(() => {
    clearWelcomePayload();
    setPayload(null);
  }, []);

  if (!payload) return null;

  const showQueueLoading = isKioskColaboratorPanelPath(pathname);

  return (
    <KioskFaceWelcome
      name={payload.name}
      greetingGender={payload.greetingGender}
      avatarUrl={payload.avatarUrl}
      facePhotoUrl={payload.facePhotoUrl}
      showLoading={showQueueLoading}
      ready={!showQueueLoading || destinationReady}
      onDone={handleDone}
    />
  );
}