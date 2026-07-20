import type { CSSProperties, ReactNode } from "react";

import { COLABORATOR_CONTENT_SURFACE_CLASS } from "@/components/colaborator/colaborator-content-surface";
import { ColaboratorSurface } from "@/components/colaborator/colaborator-surface";
import { KioskLayoutClient } from "@/components/kiosk/kiosk-layout-client";
import { RouteThemeFrame } from "@/components/themes/route-theme-frame";
import { loadRouteThemes } from "@/lib/strapi/route-themes";
import { loadKioskSessionIdleMs } from "@/lib/strapi/kiosk-setting";
import { cn } from "@/lib/utils";
import {
  routeThemeContentFrameClass,
  routeThemeContentSurfaceRadiusClass,
  routeThemeSurfacePanelStyle,
} from "@/lib/themes/match-route-theme";

export default async function KioskLayout({ children }: { children: ReactNode }) {
  const [sessionIdleMs, themes] = await Promise.all([
    loadKioskSessionIdleMs(),
    loadRouteThemes(),
  ]);
  const theme = themes.find((entry) => entry.routeKey === "kiosk") ?? null;
  const panelStyle = routeThemeSurfacePanelStyle(theme) as CSSProperties;

  return (
    <KioskLayoutClient sessionIdleMs={sessionIdleMs}>
      <ColaboratorSurface>
        <RouteThemeFrame theme={theme} fallbackClassName="bg-[var(--surface-warm)]">
          <main
            className={cn("relative z-10", routeThemeContentFrameClass(theme))}
          >
            <div
              className={cn(
                COLABORATOR_CONTENT_SURFACE_CLASS,
                routeThemeContentSurfaceRadiusClass(theme),
              )}
              style={panelStyle}
            >
              {children}
            </div>
          </main>
        </RouteThemeFrame>
      </ColaboratorSurface>
    </KioskLayoutClient>
  );
}
