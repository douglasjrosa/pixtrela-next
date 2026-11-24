import type { ReactNode } from "react";

import { ColaboratorSurface } from "@/components/colaborator/colaborator-surface";
import { RouteThemeBackground } from "@/components/themes/route-theme-background";
import { RouteThemeMatchedMain } from "@/components/themes/route-theme-matched-main";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const themes = await loadRouteThemes();

  return (
    <ColaboratorSurface>
      <div className="relative flex min-h-dvh flex-col">
        <RouteThemeBackground
          themes={themes}
          fallbackClassName="bg-[var(--surface-warm)]"
        />
        <RouteThemeMatchedMain themes={themes}>{children}</RouteThemeMatchedMain>
      </div>
    </ColaboratorSurface>
  );
}
