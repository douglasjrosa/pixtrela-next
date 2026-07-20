import type { CSSProperties, ReactNode } from "react";

import { COLABORATOR_CONTENT_SURFACE_CLASS } from "@/components/colaborator/colaborator-content-surface";
import { ColaboratorHeader } from "@/components/colaborator/colaborator-header";
import { ColaboratorSurface } from "@/components/colaborator/colaborator-surface";
import { RouteThemeFrame } from "@/components/themes/route-theme-frame";
import { loadRouteThemes } from "@/lib/strapi/route-themes";
import { cn } from "@/lib/utils";
import {
  routeThemeContentFrameClass,
  routeThemeContentSurfaceRadiusClass,
  routeThemeSurfacePanelStyle,
} from "@/lib/themes/match-route-theme";

export default async function ColaboratorPrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const themes = await loadRouteThemes();
  const theme = themes.find((entry) => entry.routeKey === "colaborator") ?? null;
  const panelStyle = routeThemeSurfacePanelStyle(theme) as CSSProperties;

  return (
    <ColaboratorSurface>
      <RouteThemeFrame theme={theme} fallbackClassName="bg-[var(--surface-warm)]">
        <ColaboratorHeader />
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
  );
}
