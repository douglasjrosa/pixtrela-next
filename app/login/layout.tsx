import type { CSSProperties, ReactNode } from "react";

import { RouteThemeFrame } from "@/components/themes/route-theme-frame";
import { loadRouteThemes } from "@/lib/strapi/route-themes";
import { cn } from "@/lib/utils";
import {
  routeThemeContentFrameClass,
  routeThemeForegroundStyle,
} from "@/lib/themes/match-route-theme";

export default async function LoginLayout({ children }: { children: ReactNode }) {
  const themes = await loadRouteThemes();
  const theme = themes.find((entry) => entry.routeKey === "login") ?? null;
  const foregroundStyle = routeThemeForegroundStyle(theme) as CSSProperties;

  return (
    <RouteThemeFrame theme={theme}>
      <div
        className={cn(
          "flex min-h-dvh flex-1 flex-col items-center justify-center",
          routeThemeContentFrameClass(theme),
        )}
        style={foregroundStyle}
      >
        {children}
      </div>
    </RouteThemeFrame>
  );
}
