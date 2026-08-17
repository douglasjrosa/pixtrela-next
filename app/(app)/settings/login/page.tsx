import { EntryAccessForm } from "@/components/settings/entry-access-form";
import { loadEntryAccessSettings } from "@/lib/entry-access/load-entry-access";
import type { EntryAccessByDevice } from "@/lib/business/entry-access";

import { updateEntryAccessSettings } from "../actions";

export default async function SettingsLoginPage() {
  const access = await loadEntryAccessSettings("login");

  async function handleSaveAccess(
    value: EntryAccessByDevice,
  ): Promise<void> {
    "use server";
    await updateEntryAccessSettings({
      surface: "login",
      computer: value.computer,
      mobile: value.mobile,
    });
  }

  return <EntryAccessForm value={access} onSave={handleSaveAccess} />;
}
