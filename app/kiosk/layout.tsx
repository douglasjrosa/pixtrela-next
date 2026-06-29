import type { ReactNode } from "react";

import { KioskLayoutClient } from "@/components/kiosk/kiosk-layout-client";
import { loadKioskSessionIdleMs } from "@/lib/strapi/kiosk-setting";

export default async function KioskLayout({ children }: { children: ReactNode }) {
  const sessionIdleMs = await loadKioskSessionIdleMs();

  return (
    <KioskLayoutClient sessionIdleMs={sessionIdleMs}>
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1">{children}</main>
      </div>
    </KioskLayoutClient>
  );
}
