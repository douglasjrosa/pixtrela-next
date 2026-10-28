import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import { MaterialFlagsSettingsProvider } from "@/components/material-flags/material-flags-settings-provider";
import { RouteThemeBackground } from "@/components/themes/route-theme-background";
import { RouteThemeContentFrame } from "@/components/themes/route-theme-content-frame";
import { loadMaterialFlagsSettings } from "@/lib/material-flags/load-material-flags-settings";
import { loadBrandingForLayout } from "@/lib/themes/load-branding";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [themes, branding, flagsSettings] = await Promise.all([
    loadRouteThemes(),
    loadBrandingForLayout(),
    loadMaterialFlagsSettings(),
  ]);
  const menuLogo = branding.menu_logo;

  return (
    <MaterialFlagsSettingsProvider enabled={flagsSettings.enabled}>
      <div className="relative flex min-h-dvh flex-col">
        <RouteThemeBackground themes={themes} />
        <AppNav
          logoUrl={menuLogo.mediaUrl}
          menuLogoBackgroundColor={menuLogo.config.backgroundColor ?? null}
          menuLogoBackgroundColorOpacity={
            menuLogo.config.backgroundColorOpacity ?? 0
          }
        />
        <RouteThemeContentFrame themes={themes}>
          {children}
        </RouteThemeContentFrame>
      </div>
    </MaterialFlagsSettingsProvider>
  );
}
