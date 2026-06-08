"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { KIOSK_HOME_PATH } from "@/lib/auth/colaborator-routes";
import { createKioskIdleTimer } from "@/lib/business/kiosk-idle";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

export function useKioskIdle(): { reset: () => void } {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof createKioskIdleTimer> | null>(null);

  useEffect(() => {
    const timer = createKioskIdleTimer(() => {
      router.push(KIOSK_HOME_PATH);
    });
    timerRef.current = timer;
    timer.reset();

    function handleActivity(): void {
      timer.reset();
    }

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      timer.clear();
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      timerRef.current = null;
    };
  }, [router]);

  function reset(): void {
    timerRef.current?.reset();
  }

  return { reset };
}
