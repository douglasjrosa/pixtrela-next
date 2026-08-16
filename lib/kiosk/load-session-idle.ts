import {
  DEFAULT_KIOSK_SESSION_IDLE_SECONDS,
  kioskSessionIdleSecondsToMs,
  normalizeKioskSessionIdleSeconds,
} from "@/lib/business/kiosk-session-idle";
import { normalizeKioskLiveChainIntervalSeconds } from "@/lib/business/kiosk-live-chain";
import { getKioskSettings } from "@/lib/repos/settings";
import { DEFAULT_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS } from "@/lib/schemas/kiosk-setting";

export async function loadKioskSettings(): Promise<{
  sessionIdleSeconds: number;
  maxSimultaneousSubtaskIntervalSeconds: number;
}> {
  const row = await getKioskSettings();
  return {
    sessionIdleSeconds: normalizeKioskSessionIdleSeconds(
      Number(row?.sessionIdleSeconds ?? DEFAULT_KIOSK_SESSION_IDLE_SECONDS),
    ),
    maxSimultaneousSubtaskIntervalSeconds: normalizeKioskLiveChainIntervalSeconds(
      Number(
        row?.maxSimultaneousSubtaskIntervalSeconds ??
          DEFAULT_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
      ),
    ),
  };
}

export async function loadKioskSessionIdleSeconds(): Promise<number> {
  const settings = await loadKioskSettings();
  return settings.sessionIdleSeconds;
}

export async function loadKioskLiveChainIntervalSeconds(): Promise<number> {
  const settings = await loadKioskSettings();
  return settings.maxSimultaneousSubtaskIntervalSeconds;
}

export async function loadKioskSessionIdleMs(): Promise<number> {
  const seconds = await loadKioskSessionIdleSeconds();
  return kioskSessionIdleSecondsToMs(seconds);
}
