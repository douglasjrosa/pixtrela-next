import { KioskEntryScreen } from "@/components/kiosk/kiosk-entry-screen";
import { loadEntryAccessSettings } from "@/lib/entry-access/load-entry-access";

import { KioskHomeClient } from "./kiosk-home-client";

export default async function KioskPage() {
  const accessSettings = await loadEntryAccessSettings("kiosk");

  return (
    <KioskEntryScreen>
      <KioskHomeClient accessSettings={accessSettings} />
    </KioskEntryScreen>
  );
}
