import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import { ColaboratorHeader } from "@/components/colaborator/colaborator-header";
import { ColaboratorSurface } from "@/components/colaborator/colaborator-surface";
import { MaterialFlagsSettingsProvider } from "@/components/material-flags/material-flags-settings-provider";
import { RouteThemeBackground } from "@/components/themes/route-theme-background";
import { RouteThemeMatchedMain } from "@/components/themes/route-theme-matched-main";
import { getAppSession } from "@/lib/auth/app-session";
import { homeHrefForRole, type Role } from "@/lib/auth/nav";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import { loadSessionTotemMode } from "@/lib/auth/totem-mode-state";
import { loadMaterialFlagsSettings } from "@/lib/material-flags/load-material-flags-settings";
import { loadBrandingForLayout } from "@/lib/themes/load-branding";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";

export default async function DocumentIdLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;
  const totemMode = await loadSessionTotemMode(userId);
  const branding = await loadBrandingForLayout();
  const flagsSettings = await loadMaterialFlagsSettings();
  const menuLogo = branding.menu_logo;
  const flagsEnabled = flagsSettings.enabled;

  if (role === "manager") {
    return (
      <MaterialFlagsSettingsProvider enabled={flagsEnabled}>
        <div className="relative flex min-h-dvh flex-col">
          <AppNav
            logoUrl={menuLogo.mediaUrl}
            menuLogoBackgroundColor={menuLogo.config.backgroundColor ?? null}
            menuLogoBackgroundColorOpacity={
              menuLogo.config.backgroundColorOpacity ?? 0
            }
          />
          <main className="relative z-10 flex-1 px-4 py-6">{children}</main>
        </div>
      </MaterialFlagsSettingsProvider>
    );
  }

  const themes = await loadRouteThemes();
  const producerRole = role === "leader" || role === "colaborator";

  if (!producerRole) {
    return (
      <MaterialFlagsSettingsProvider enabled={flagsEnabled}>
        <div className="relative flex min-h-dvh flex-col">
          <AppNav
            logoUrl={menuLogo.mediaUrl}
            menuLogoBackgroundColor={menuLogo.config.backgroundColor ?? null}
            menuLogoBackgroundColorOpacity={
              menuLogo.config.backgroundColorOpacity ?? 0
            }
          />
          <main className="relative z-10 flex-1 px-4 py-6">{children}</main>
        </div>
      </MaterialFlagsSettingsProvider>
    );
  }

  return (
    <MaterialFlagsSettingsProvider enabled={flagsEnabled}>
      <ColaboratorSurface>
        <div className="relative flex min-h-dvh flex-col">
          <RouteThemeBackground
            themes={themes}
            fallbackClassName="bg-[var(--surface-warm)]"
          />
          <div className="relative z-10 flex min-h-dvh flex-1 flex-col">
            <ColaboratorHeader
              homeHref={homeHrefForRole(role, userId, {
                totemMode,
              })}
              logoUrl={menuLogo.mediaUrl}
              menuLogoBackgroundColor={menuLogo.config.backgroundColor ?? null}
              menuLogoBackgroundColorOpacity={
                menuLogo.config.backgroundColorOpacity ?? 0
              }
              totemMode={totemMode}
              showTotemSwitch={canAccessOwnProfile(role) && Boolean(userId)}
            />
            <RouteThemeMatchedMain themes={themes} withDocumentPanel>
              {children}
            </RouteThemeMatchedMain>
          </div>
        </div>
      </ColaboratorSurface>
    </MaterialFlagsSettingsProvider>
  );
}
