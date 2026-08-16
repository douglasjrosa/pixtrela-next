import { KioskEntryScreen } from "@/components/kiosk/kiosk-entry-screen";

import { KioskHomeClient } from "./kiosk-home-client";

export default function KioskPage() {
  return (
    <KioskEntryScreen>
      <KioskHomeClient />
    </KioskEntryScreen>
  );
}
