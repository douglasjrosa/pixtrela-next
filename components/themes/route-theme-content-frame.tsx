"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";

import { APP_CONTENT_SURFACE_CLASS } from "@/components/layout/app-page-layout";
import { cn } from "@/lib/utils";
import {
  matchRouteTheme,
  routeThemeContentFrameClass,
  routeThemeContentSurfaceRadiusClass,
  routeThemeSurfacePanelStyle,
  type RouteThemeView,
} from "@/lib/themes/match-route-theme";

export interface RouteThemeContentFrameProps {
  themes: RouteThemeView[];
  children: ReactNode;
  className?: string;
  surfaceClassName?: string;
}

/**
 * Client frame that applies per-route content margins from the matched theme.
 * Does not wrap AppNav — only the main content surface.
 */
export function RouteThemeContentFrame({
  themes,
  children,
  className,
  surfaceClassName = APP_CONTENT_SURFACE_CLASS,
}: RouteThemeContentFrameProps) {
  const pathname = usePathname() ?? "/";
  const theme = matchRouteTheme(pathname, themes);
  const frameClass = routeThemeContentFrameClass(theme);
  const radiusClass = routeThemeContentSurfaceRadiusClass(theme);
  const panelStyle = routeThemeSurfacePanelStyle(theme) as CSSProperties;

  return (
    <main className={cn("relative z-10", frameClass, className)}>
      <div className={cn(surfaceClassName, radiusClass)} style={panelStyle}>
        {children}
      </div>
    </main>
  );
}
