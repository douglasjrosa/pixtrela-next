import type { ReactNode } from "react";

import { RouteThemeBackground } from "@/components/themes/route-theme-background";
import type { RouteThemeView } from "@/lib/themes/match-route-theme";

export interface RouteThemeFrameProps {
  theme: RouteThemeView | null;
  children: ReactNode;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Server Component shell: content stays outside the theme client boundary.
 * Background (including fixed/parallax) is painted by RouteThemeBackground.
 */
export function RouteThemeFrame({
  theme,
  children,
  className,
  fallbackClassName = "bg-background",
}: RouteThemeFrameProps) {
  return (
    <div className={`relative flex min-h-dvh flex-col ${className ?? ""}`}>
      <RouteThemeBackground theme={theme} fallbackClassName={fallbackClassName} />
      <div className="relative z-10 flex min-h-dvh flex-1 flex-col">{children}</div>
    </div>
  );
}
