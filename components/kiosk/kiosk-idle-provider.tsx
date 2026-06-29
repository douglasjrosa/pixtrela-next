"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { KIOSK_HOME_PATH } from "@/lib/auth/colaborator-routes";
import {
  KIOSK_IDLE_MS,
  createKioskIdleController,
} from "@/lib/business/kiosk-idle";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;
const LOCK_NAV_DELAY_MS = 150;

export type KioskIdlePhase = "home" | "active" | "expiring";

type KioskIdleContextValue = {
  progress: number;
  phase: KioskIdlePhase;
  reset: () => void;
  lockSession: () => void;
};

const KioskIdleContext = createContext<KioskIdleContextValue | null>(null);

export function useKioskIdleContext(): KioskIdleContextValue {
  const value = useContext(KioskIdleContext);
  if (!value) {
    throw new Error("useKioskIdleContext must be used within KioskIdleProvider");
  }
  return value;
}

export function KioskIdleProvider({
  children,
  sessionIdleMs = KIOSK_IDLE_MS,
}: {
  children: ReactNode;
  sessionIdleMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isHomeScreen = pathname === KIOSK_HOME_PATH;
  const [progress, setProgress] = useState(isHomeScreen ? 1 : 0);
  const [phase, setPhase] = useState<KioskIdlePhase>(isHomeScreen ? "home" : "active");
  const isExpiringRef = useRef(false);
  const controllerRef = useRef<ReturnType<typeof createKioskIdleController> | null>(
    null,
  );

  const reset = useCallback(() => {
    if (isExpiringRef.current) return;
    isExpiringRef.current = false;
    setPhase("active");
    controllerRef.current?.reset();
  }, []);

  const expireSession = useCallback(
    (immediate: boolean) => {
      if (isExpiringRef.current || isHomeScreen) return;
      isExpiringRef.current = true;
      controllerRef.current?.clear();
      setPhase("expiring");
      setProgress(1);
      if (immediate) {
        router.replace(KIOSK_HOME_PATH);
        return;
      }
      window.setTimeout(() => {
        router.replace(KIOSK_HOME_PATH);
      }, LOCK_NAV_DELAY_MS);
    },
    [isHomeScreen, router],
  );

  const lockSession = useCallback(() => {
    expireSession(true);
  }, [expireSession]);

  useEffect(() => {
    if (isHomeScreen) {
      controllerRef.current?.clear();
      controllerRef.current = null;
      isExpiringRef.current = false;
      setProgress(1);
      setPhase("home");
      return;
    }

    const controller = createKioskIdleController({
      durationMs: sessionIdleMs,
      onProgress: (value) => {
        if (isExpiringRef.current) return;
        setProgress(value);
      },
      onIdle: () => {
        expireSession(false);
      },
    });

    controllerRef.current = controller;
    isExpiringRef.current = false;
    setPhase("active");
    controller.reset();

    function handleActivity(): void {
      if (isExpiringRef.current) return;
      controller.reset();
    }

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      controller.clear();
      controllerRef.current = null;
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isHomeScreen, router, expireSession, sessionIdleMs]);

  const value = useMemo(
    () => ({ progress, phase, reset, lockSession }),
    [progress, phase, reset, lockSession],
  );

  return (
    <KioskIdleContext.Provider value={value}>{children}</KioskIdleContext.Provider>
  );
}

/** @deprecated Prefer KioskIdleProvider at layout level */
export function useKioskIdle(): { reset: () => void } {
  const { reset } = useKioskIdleContext();
  return { reset };
}
