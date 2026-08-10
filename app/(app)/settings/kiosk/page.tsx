import {
  DEFAULT_KIOSK_SESSION_IDLE_SECONDS,
  normalizeKioskSessionIdleSeconds,
} from "@/lib/business/kiosk-session-idle";
import { KioskSessionIdleForm } from "@/components/settings/kiosk-session-idle-form";
import { isDrizzleBackend } from "@/lib/db/backend";
import { getKioskSettings } from "@/lib/repos/settings";
import { loadKioskSessionIdleSeconds } from "@/lib/strapi/kiosk-setting";

import { updateKioskSessionIdleSeconds } from "../actions";

async function loadIdleSeconds(): Promise<number> {
  if (isDrizzleBackend()) {
    const row = await getKioskSettings();
    return normalizeKioskSessionIdleSeconds(
      Number(row?.sessionIdleSeconds ?? DEFAULT_KIOSK_SESSION_IDLE_SECONDS),
    );
  }
  return loadKioskSessionIdleSeconds();
}

export default async function SettingsKioskPage() {
  const sessionIdleSeconds = await loadIdleSeconds();

  async function handleSaveKioskSession(values: {
    sessionIdleSeconds: number;
  }): Promise<void> {
    "use server";
    await updateKioskSessionIdleSeconds(values.sessionIdleSeconds);
  }

  return (
    <KioskSessionIdleForm
      sessionIdleSeconds={sessionIdleSeconds}
      onSave={handleSaveKioskSession}
    />
  );
}
