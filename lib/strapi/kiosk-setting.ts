import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  DEFAULT_KIOSK_SESSION_IDLE_SECONDS,
  kioskSessionIdleSecondsToMs,
  normalizeKioskSessionIdleSeconds,
} from "@/lib/business/kiosk-session-idle";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

/** Strapi 5 single-type REST path (singular API id, no documentId). */
export const KIOSK_SETTING_API_PATH = "/kiosk-setting";

interface KioskSettingEntity {
  sessionIdleSeconds: number;
}

interface StrapiSingle<T> {
  data: T | null;
}

export async function loadKioskSessionIdleSeconds(): Promise<number> {
  try {
    const res = await strapiFetch<StrapiSingle<KioskSettingEntity>>(
      KIOSK_SETTING_API_PATH,
      { strapiCache: { tags: [STRAPI_TAGS.kioskSetting], revalidate: 60 } },
      { fields: ["sessionIdleSeconds"] },
    );
    return normalizeKioskSessionIdleSeconds(
      Number(res.data?.sessionIdleSeconds ?? DEFAULT_KIOSK_SESSION_IDLE_SECONDS),
    );
  } catch (error) {
    rethrowIfNavigationError(error);
    return DEFAULT_KIOSK_SESSION_IDLE_SECONDS;
  }
}

export async function loadKioskSessionIdleMs(): Promise<number> {
  const seconds = await loadKioskSessionIdleSeconds();
  return kioskSessionIdleSecondsToMs(seconds);
}
