import { KioskSessionIdleForm } from "@/components/settings/kiosk-session-idle-form";
import { loadKioskSettings } from "@/lib/kiosk/load-session-idle";
import type { KioskSessionIdleInput } from "@/lib/schemas/kiosk-setting";

import { updateKioskSessionIdleSeconds } from "../actions";

export default async function SettingsKioskPage() {
  const settings = await loadKioskSettings();

  async function handleSaveKioskSession(
    values: KioskSessionIdleInput,
  ): Promise<void> {
    "use server";
    await updateKioskSessionIdleSeconds(values);
  }

  return (
    <KioskSessionIdleForm
      sessionIdleSeconds={settings.sessionIdleSeconds}
      maxSimultaneousSubtaskIntervalSeconds={
        settings.maxSimultaneousSubtaskIntervalSeconds
      }
      onSave={handleSaveKioskSession}
    />
  );
}
