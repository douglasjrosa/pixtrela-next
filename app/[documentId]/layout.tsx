import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import { ColaboratorHeader } from "@/components/colaborator/colaborator-header";
import { ColaboratorSurface } from "@/components/colaborator/colaborator-surface";
import { RouteThemeBackground } from "@/components/themes/route-theme-background";
import { RouteThemeMatchedMain } from "@/components/themes/route-theme-matched-main";
import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { loadBrandingForLayout } from "@/lib/themes/load-branding";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";

export default async function DocumentIdLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const branding = await loadBrandingForLayout();
  const menuLogo = branding.menu_logo;

  if (role === "manager" || role === "leader") {
    return (
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
    );
  }

  const themes = await loadRouteThemes();

  return (
    <ColaboratorSurface className="overflow-x-hidden">
      <div className="relative flex min-h-dvh flex-col">
        <RouteThemeBackground
          themes={themes}
          fallbackClassName="bg-[var(--surface-warm)]"
        />
        <div className="relative z-10 flex min-h-dvh flex-1 flex-col">
          <ColaboratorHeader
            homeHref={session?.user?.id ? `/${session.user.id}` : "/"}
            logoUrl={menuLogo.mediaUrl}
            menuLogoBackgroundColor={menuLogo.config.backgroundColor ?? null}
            menuLogoBackgroundColorOpacity={
              menuLogo.config.backgroundColorOpacity ?? 0
            }
          />
          <RouteThemeMatchedMain themes={themes} withDocumentPanel>
            {children}
          </RouteThemeMatchedMain>
        </div>
      </div>
    </ColaboratorSurface>
  );
}
