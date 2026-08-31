"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";

import { ColaboratorDocumentPanel } from
  "@/components/colaborator/colaborator-document-panel";
import { cn } from "@/lib/utils";
import {
  matchRouteTheme,
  routeThemeContentFrameClass,
  routeThemeContentSurfaceRadiusClass,
  routeThemeSurfacePanelStyle,
  type RouteThemeView,
} from "@/lib/themes/match-route-theme";

export type RouteThemeMatchedMainProps = {
  themes: RouteThemeView[];
  children: ReactNode;
  className?: string;
  /** When true, wraps children in the colaborator document surface panel. */
  withDocumentPanel?: boolean;
};

/**
 * Client main frame that applies margins/surface from the pathname-matched theme.
 */
export function RouteThemeMatchedMain({
  themes,
  children,
  className,
  withDocumentPanel = false,
}: RouteThemeMatchedMainProps) {
  const pathname = usePathname() ?? "/";
  const theme = matchRouteTheme(pathname, themes);
  const frameClass = routeThemeContentFrameClass(theme);
  const panelStyle = routeThemeSurfacePanelStyle(theme) as CSSProperties;

  if (withDocumentPanel) {
    return (
      <main
        className={cn(
          "relative z-10 min-w-0 overflow-x-hidden",
          frameClass,
          className,
        )}
      >
        <ColaboratorDocumentPanel
          className={routeThemeContentSurfaceRadiusClass(theme)}
          style={panelStyle}
        >
          {children}
        </ColaboratorDocumentPanel>
      </main>
    );
  }

  return (
    <main
      className={cn(
        "relative z-10 flex min-h-dvh flex-1 flex-col",
        frameClass,
        className,
      )}
    >
      {children}
    </main>
  );
}
