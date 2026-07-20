import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import { RouteThemeBackground } from "@/components/themes/route-theme-background";
import { RouteThemeContentFrame } from "@/components/themes/route-theme-content-frame";
import { loadRouteThemes } from "@/lib/strapi/route-themes";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const themes = await loadRouteThemes();

  return (
    <div className="relative flex min-h-dvh flex-col">
      <RouteThemeBackground themes={themes} />
      <AppNav />
      <RouteThemeContentFrame themes={themes}>{children}</RouteThemeContentFrame>
    </div>
  );
}
