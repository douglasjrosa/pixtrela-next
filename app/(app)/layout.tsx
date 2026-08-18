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

  return (
    <div className="relative flex min-h-dvh flex-col">
      <RouteThemeBackground themes={themes} />
      <AppNav
        logoUrl={branding.menuLogoUrl}
        menuLogoBackgroundColor={branding.menuLogoBackgroundColor}
        menuLogoBackgroundColorOpacity={branding.menuLogoBackgroundColorOpacity}
      />
      <RouteThemeContentFrame themes={themes}>{children}</RouteThemeContentFrame>
    </div>
  );
}
