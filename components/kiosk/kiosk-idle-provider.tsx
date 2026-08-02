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

export type KioskIdlePhase = "home" | "active" | "auth" | "expiring";

type KioskIdleContextValue = {
  progress: number;
  phase: KioskIdlePhase;
  reset: () => void;
  lockSession: () => void;
  /** Fixed countdown (no activity reset). Used on home camera/code flows. */
  startAuthCountdown: (onExpire: () => void) => void;
  clearAuthCountdown: () => void;
  setAuthCancelHandler: (handler: (() => void) | null) => void;
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
  const [phase, setPhase] = useState<KioskIdlePhase>(
    isHomeScreen ? "home" : "active",
  );
  const isExpiringRef = useRef(false);
  const phaseRef = useRef<KioskIdlePhase>(isHomeScreen ? "home" : "active");
  const authExpireRef = useRef<(() => void) | null>(null);
  const authCancelRef = useRef<(() => void) | null>(null);
  const controllerRef = useRef<ReturnType<typeof createKioskIdleController> | null>(
    null,
  );

  const setPhaseSafe = useCallback((next: KioskIdlePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearController = useCallback(() => {
    controllerRef.current?.clear();
    controllerRef.current = null;
  }, []);

  const clearAuthCountdown = useCallback(() => {
    authExpireRef.current = null;
    clearController();
    if (pathname === KIOSK_HOME_PATH) {
      setPhaseSafe("home");
      setProgress(1);
    }
  }, [clearController, pathname, setPhaseSafe]);

  const startAuthCountdown = useCallback(
    (onExpire: () => void) => {
      if (pathname !== KIOSK_HOME_PATH) return;
      isExpiringRef.current = false;
      authExpireRef.current = onExpire;
      clearController();
      setPhaseSafe("auth");
      setProgress(0);

      const controller = createKioskIdleController({
        durationMs: sessionIdleMs,
        onProgress: (value) => {
          setProgress(value);
        },
        onIdle: () => {
          const expire = authExpireRef.current;
          authExpireRef.current = null;
          clearController();
          expire?.();
        },
      });
      controllerRef.current = controller;
      controller.reset();
    },
    [clearController, pathname, sessionIdleMs, setPhaseSafe],
  );

  const setAuthCancelHandler = useCallback((handler: (() => void) | null) => {
    authCancelRef.current = handler;
  }, []);

  const reset = useCallback(() => {
    if (isExpiringRef.current) return;
    if (phaseRef.current === "auth") return;
    isExpiringRef.current = false;
    setPhaseSafe("active");
    controllerRef.current?.reset();
  }, [setPhaseSafe]);

  const expireSession = useCallback(
    (immediate: boolean) => {
      if (isExpiringRef.current || isHomeScreen) return;
      isExpiringRef.current = true;
      clearController();
      setPhaseSafe("expiring");
      setProgress(1);
      if (immediate) {
        router.replace(KIOSK_HOME_PATH);
        return;
      }
      window.setTimeout(() => {
        router.replace(KIOSK_HOME_PATH);
      }, LOCK_NAV_DELAY_MS);
    },
    [clearController, isHomeScreen, router, setPhaseSafe],
  );

  const lockSession = useCallback(() => {
    if (phaseRef.current === "auth") {
      clearAuthCountdown();
      authCancelRef.current?.();
      return;
    }
    expireSession(true);
  }, [clearAuthCountdown, expireSession]);

  useEffect(() => {
    if (isHomeScreen) {
      if (phaseRef.current === "auth") return;
      clearController();
      isExpiringRef.current = false;
      setProgress(1);
      setPhaseSafe("home");
      return;
    }

    authExpireRef.current = null;
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
    setPhaseSafe("active");
    controller.reset();

    function handleActivity(): void {
      if (isExpiringRef.current) return;
      if (phaseRef.current === "auth") return;
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
  }, [
    isHomeScreen,
    expireSession,
    sessionIdleMs,
    clearController,
    setPhaseSafe,
  ]);

  const value = useMemo(
    () => ({
      progress,
      phase,
      reset,
      lockSession,
      startAuthCountdown,
      clearAuthCountdown,
      setAuthCancelHandler,
    }),
    [
      progress,
      phase,
      reset,
      lockSession,
      startAuthCountdown,
      clearAuthCountdown,
      setAuthCancelHandler,
    ],
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
