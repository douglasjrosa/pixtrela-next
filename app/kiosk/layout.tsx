import type { ReactNode } from "react";

import { ColaboratorSurface } from "@/components/colaborator/colaborator-surface";
import { KioskLayoutClient } from "@/components/kiosk/kiosk-layout-client";
import { RouteThemeBackground } from "@/components/themes/route-theme-background";
import { RouteThemeMatchedMain } from "@/components/themes/route-theme-matched-main";
import { loadKioskSessionIdleMs } from "@/lib/kiosk/load-session-idle";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";

export default async function KioskLayout({ children }: { children: ReactNode }) {
  const [sessionIdleMs, themes] = await Promise.all([
    loadKioskSessionIdleMs(),
    loadRouteThemes(),
  ]);

  return (
    <KioskLayoutClient sessionIdleMs={sessionIdleMs}>
      <ColaboratorSurface>
        <div className="relative flex min-h-dvh flex-col">
          <RouteThemeBackground
            themes={themes}
            fallbackClassName="bg-[var(--surface-warm)]"
          />
          <RouteThemeMatchedMain themes={themes}>{children}</RouteThemeMatchedMain>
        </div>
      </ColaboratorSurface>
    </KioskLayoutClient>
  );
}
