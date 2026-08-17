import type { CSSProperties, ReactNode } from "react";

import { COLABORATOR_CONTENT_SURFACE_CLASS } from "@/components/colaborator/colaborator-content-surface";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";
import { cn } from "@/lib/utils";
import {
  routeThemeContentSurfaceRadiusClass,
  routeThemeSurfacePanelStyle,
} from "@/lib/themes/match-route-theme";

export interface KioskContentSurfaceProps {
  children: ReactNode;
  className?: string;
}

/** Opaque panel over kiosk route theme backgrounds. */
export async function KioskContentSurface({
  children,
  className,
}: KioskContentSurfaceProps) {
  const themes = await loadRouteThemes();
  const theme = themes.find((entry) => entry.routeKey === "kiosk") ?? null;
  const panelStyle = routeThemeSurfacePanelStyle(theme) as CSSProperties;

  return (
    <div
      className={cn(
        COLABORATOR_CONTENT_SURFACE_CLASS,
        routeThemeContentSurfaceRadiusClass(theme),
        "flex min-h-0 flex-1 flex-col",
        className,
      )}
      style={panelStyle}
    >
      {children}
    </div>
  );
}
