import { EntryAccessForm } from "@/components/settings/entry-access-form";
import { KioskSessionIdleForm } from "@/components/settings/kiosk-session-idle-form";
import { loadEntryAccessSettings } from "@/lib/entry-access/load-entry-access";
import { loadKioskSettings } from "@/lib/kiosk/load-session-idle";
import type { EntryAccessByDevice } from "@/lib/business/entry-access";

import {
  updateEntryAccessSettings,
  updateKioskSessionIdleSeconds,
} from "../actions";

export default async function SettingsKioskPage() {
  const [settings, access] = await Promise.all([
    loadKioskSettings(),
    loadEntryAccessSettings("kiosk"),
  ]);

  async function handleSaveAccess(
    value: EntryAccessByDevice,
  ): Promise<void> {
    "use server";
    await updateEntryAccessSettings({
      surface: "kiosk",
      computer: value.computer,
      mobile: value.mobile,
    });
  }

  return (
    <div className="space-y-10">
      <KioskSessionIdleForm
        sessionIdleSeconds={settings.sessionIdleSeconds}
        maxSimultaneousSubtaskIntervalSeconds={
          settings.maxSimultaneousSubtaskIntervalSeconds
        }
        queuePageSize={settings.queuePageSize}
        action={updateKioskSessionIdleSeconds}
      />
      <EntryAccessForm value={access} onSave={handleSaveAccess} />
    </div>
  );
}
