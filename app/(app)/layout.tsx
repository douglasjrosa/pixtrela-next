import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import { RouteThemeBackground } from "@/components/themes/route-theme-background";
import { RouteThemeContentFrame } from "@/components/themes/route-theme-content-frame";
import { loadBrandingForLayout } from "@/lib/themes/load-branding";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [themes, branding] = await Promise.all([
    loadRouteThemes(),
    loadBrandingForLayout(),
  ]);
  const menuLogo = branding.menu_logo;

  return (
    <div className="relative flex min-h-dvh flex-col">
      <RouteThemeBackground themes={themes} />
      <AppNav
        logoUrl={menuLogo.mediaUrl}
        menuLogoBackgroundColor={menuLogo.config.backgroundColor ?? null}
        menuLogoBackgroundColorOpacity={
          menuLogo.config.backgroundColorOpacity ?? 0
        }
      />
      <RouteThemeContentFrame themes={themes}>{children}</RouteThemeContentFrame>
    </div>
  );
}
