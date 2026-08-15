import {
  DEFAULT_KIOSK_SESSION_IDLE_SECONDS,
  kioskSessionIdleSecondsToMs,
  normalizeKioskSessionIdleSeconds,
} from "@/lib/business/kiosk-session-idle";
import { getKioskSettings } from "@/lib/repos/settings";

export async function loadKioskSessionIdleSeconds(): Promise<number> {
  const row = await getKioskSettings();
  return normalizeKioskSessionIdleSeconds(
    Number(row?.sessionIdleSeconds ?? DEFAULT_KIOSK_SESSION_IDLE_SECONDS),
  );
}

export async function loadKioskSessionIdleMs(): Promise<number> {
  const seconds = await loadKioskSessionIdleSeconds();
  return kioskSessionIdleSecondsToMs(seconds);
}
