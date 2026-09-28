import { EntryAccessForm } from "@/components/settings/entry-access-form";
import { loadEntryAccessSettings } from "@/lib/entry-access/load-entry-access";
import type { EntryAccessByDevice } from "@/lib/business/entry-access";

import { updateEntryAccessSettings } from "../actions";

export default async function SettingsLoginPage() {
  const [loginAccess, kioskAccess] = await Promise.all([
    loadEntryAccessSettings("login"),
    loadEntryAccessSettings("kiosk"),
  ]);

  async function handleSaveLoginAccess(
    value: EntryAccessByDevice,
  ): Promise<void> {
    "use server";
    await updateEntryAccessSettings({
      surface: "login",
      computer: value.computer,
      mobile: value.mobile,
    });
  }

  async function handleSaveKioskAccess(
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
      <EntryAccessForm value={loginAccess} onSave={handleSaveLoginAccess} />
      <EntryAccessForm
        value={kioskAccess}
        onSave={handleSaveKioskAccess}
        headingKey="entryAccessKioskHeading"
      />
    </div>
  );
}
