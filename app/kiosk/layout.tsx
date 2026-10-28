import type { ReactNode } from "react";

import { ColaboratorSurface } from "@/components/colaborator/colaborator-surface";
import { KioskLayoutClient } from "@/components/kiosk/kiosk-layout-client";
import { MaterialFlagsSettingsProvider } from "@/components/material-flags/material-flags-settings-provider";
import { RouteThemeBackground } from "@/components/themes/route-theme-background";
import { RouteThemeMatchedMain } from "@/components/themes/route-theme-matched-main";
import { loadKioskSessionIdleMs } from "@/lib/kiosk/load-session-idle";
import { loadMaterialFlagsSettings } from "@/lib/material-flags/load-material-flags-settings";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";

export const dynamic = "force-dynamic";

export default async function KioskLayout({ children }: { children: ReactNode }) {
  const [sessionIdleMs, themes, flagsSettings] = await Promise.all([
    loadKioskSessionIdleMs(),
    loadRouteThemes(),
    loadMaterialFlagsSettings(),
  ]);

  return (
    <MaterialFlagsSettingsProvider enabled={flagsSettings.enabled}>
      <KioskLayoutClient sessionIdleMs={sessionIdleMs}>
        <ColaboratorSurface>
          <div className="relative flex min-h-dvh flex-col">
            <RouteThemeBackground
              themes={themes}
              fallbackClassName="bg-[var(--surface-warm)]"
            />
            <RouteThemeMatchedMain themes={themes}>
              {children}
            </RouteThemeMatchedMain>
          </div>
        </ColaboratorSurface>
      </KioskLayoutClient>
    </MaterialFlagsSettingsProvider>
  );
}
