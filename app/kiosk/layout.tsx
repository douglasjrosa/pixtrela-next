import type { CSSProperties, ReactNode } from "react";

import { ColaboratorSurface } from "@/components/colaborator/colaborator-surface";
import { KioskLayoutClient } from "@/components/kiosk/kiosk-layout-client";
import { RouteThemeFrame } from "@/components/themes/route-theme-frame";
import { loadKioskSessionIdleMs } from "@/lib/kiosk/load-session-idle";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";
import { cn } from "@/lib/utils";
import {
  routeThemeContentFrameClass,
  routeThemeForegroundStyle,
} from "@/lib/themes/match-route-theme";

export default async function KioskLayout({ children }: { children: ReactNode }) {
  const [sessionIdleMs, themes] = await Promise.all([
    loadKioskSessionIdleMs(),
    loadRouteThemes(),
  ]);
  const theme = themes.find((entry) => entry.routeKey === "kiosk") ?? null;
  const foregroundStyle = routeThemeForegroundStyle(theme) as CSSProperties;

  return (
    <KioskLayoutClient sessionIdleMs={sessionIdleMs}>
      <ColaboratorSurface>
        <RouteThemeFrame theme={theme} fallbackClassName="bg-[var(--surface-warm)]">
          <main
            className={cn(
              "relative z-10 flex min-h-dvh flex-1 flex-col",
              routeThemeContentFrameClass(theme),
            )}
            style={foregroundStyle}
          >
            {children}
          </main>
        </RouteThemeFrame>
      </ColaboratorSurface>
    </KioskLayoutClient>
  );
}
