import type { CSSProperties, ReactNode } from "react";

import { auth } from "@/auth";
import { AppNav } from "@/components/app-nav";
import { COLABORATOR_CONTENT_SURFACE_CLASS } from "@/components/colaborator/colaborator-content-surface";
import { ColaboratorHeader } from "@/components/colaborator/colaborator-header";
import { ColaboratorSurface } from "@/components/colaborator/colaborator-surface";
import { RouteThemeFrame } from "@/components/themes/route-theme-frame";
import type { Role } from "@/lib/auth/nav";
import { loadBrandingForLayout } from "@/lib/themes/load-branding";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";
import { cn } from "@/lib/utils";
import {
  routeThemeContentFrameClass,
  routeThemeContentSurfaceRadiusClass,
  routeThemeSurfacePanelStyle,
} from "@/lib/themes/match-route-theme";

export default async function DocumentIdLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const branding = await loadBrandingForLayout();

  if (role === "manager" || role === "leader") {
    return (
      <div className="relative flex min-h-dvh flex-col">
        <AppNav
          logoUrl={branding.menuLogoUrl}
          menuLogoBackgroundColor={branding.menuLogoBackgroundColor}
          menuLogoBackgroundColorOpacity={branding.menuLogoBackgroundColorOpacity}
        />
        <main className="relative z-10 flex-1 px-4 py-6">{children}</main>
      </div>
    );
  }

  const themes = await loadRouteThemes();
  const theme = themes.find((entry) => entry.routeKey === "colaborator") ?? null;
  const panelStyle = routeThemeSurfacePanelStyle(theme) as CSSProperties;

  return (
    <ColaboratorSurface>
      <RouteThemeFrame theme={theme} fallbackClassName="bg-[var(--surface-warm)]">
        <ColaboratorHeader
          homeHref={session?.user?.id ? `/${session.user.id}` : "/"}
          logoUrl={branding.menuLogoUrl}
          menuLogoBackgroundColor={branding.menuLogoBackgroundColor}
          menuLogoBackgroundColorOpacity={branding.menuLogoBackgroundColorOpacity}
        />
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
