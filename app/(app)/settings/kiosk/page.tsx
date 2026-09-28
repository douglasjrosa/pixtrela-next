import { KioskSessionIdleForm } from "@/components/settings/kiosk-session-idle-form";
import { loadKioskSettings } from "@/lib/kiosk/load-session-idle";

import { updateKioskSessionIdleSeconds } from "../actions";

export default async function SettingsKioskPage() {
  const settings = await loadKioskSettings();

  return (
    <KioskSessionIdleForm
      sessionIdleSeconds={settings.sessionIdleSeconds}
      maxSimultaneousSubtaskIntervalSeconds={
        settings.maxSimultaneousSubtaskIntervalSeconds
      }
      queuePageSize={settings.queuePageSize}
      action={updateKioskSessionIdleSeconds}
    />
  );
}
