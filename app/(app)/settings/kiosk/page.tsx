import { KioskSessionIdleForm } from "@/components/settings/kiosk-session-idle-form";
import { loadKioskSessionIdleSeconds } from "@/lib/strapi/kiosk-setting";

import { updateKioskSessionIdleSeconds } from "../actions";

export default async function SettingsKioskPage() {
  const sessionIdleSeconds = await loadKioskSessionIdleSeconds();

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
